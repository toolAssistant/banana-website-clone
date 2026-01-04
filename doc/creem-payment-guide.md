# Creem支付集成指南

本文档详细说明了项目中Creem支付系统的工作原理和完整流程。

## 目录

- [核心概念](#核心概念)
  - [Creem](#creem)
  - [Webhooks](#webhooks)
  - [ngrok](#ngrok)
- [支付完整流程](#支付完整流程)
- [代码实现](#代码实现)
- [测试指南](#测试指南)

---

## 核心概念

### Creem

Creem是一个支付服务提供商(Payment Service Provider),类似于Stripe、PayPal等。

**作用:**
- 处理在线支付(信用卡、借记卡等)
- 管理订阅和周期性扣费
- 提供支付页面(checkout page)
- 处理支付安全和合规性(PCI-DSS)
- 管理客户账单和发票

**为什么使用Creem:**
- 开发者不需要自己处理敏感的支付信息
- 不需要建立复杂的支付基础设施
- 通过API集成即可快速实现支付功能

---

### Webhooks(网络钩子)

Webhook是一种"反向API"或"事件驱动的HTTP回调"。

**传统API调用:**
```
你的服务器 → 请求 → Creem服务器 → 响应 → 你的服务器
```

**Webhook回调:**
```
Creem服务器 → 主动推送事件 → 你的服务器
```

**在支付场景中的作用:**

当支付状态发生变化时,Creem会主动通知你的服务器:
- ✅ 支付成功
- ❌ 支付失败
- 🔄 订阅续费
- ⛔ 订阅取消
- 💳 退款完成

**为什么需要Webhook:**
- **异步通知**: 支付可能需要几秒到几分钟,用户可能关闭浏览器
- **可靠性**: 即使用户离开页面,你仍然能收到支付结果
- **安全性**: 防止用户伪造支付成功的状态

**Webhook处理示例:**

```javascript
// app/api/webhooks/creem/route.ts (需要创建)
export async function POST(req: NextRequest) {
  const event = await req.json()

  // 验证Webhook签名(安全性)
  const signature = req.headers.get('x-creem-signature')
  if (!verifySignature(signature, event)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 处理不同事件类型
  switch(event.type) {
    case 'checkout.completed':
      // 支付成功 - 给用户发放credits
      await database.users.update({
        where: { email: event.customer.email },
        data: {
          credits: { increment: 400 },
          subscription_status: 'active'
        }
      })

      // 发送确认邮件
      await sendEmail({
        to: event.customer.email,
        subject: '支付成功',
        body: '您已成功购买Basic计划'
      })
      break

    case 'subscription.renewed':
      // 订阅续费成功
      await renewUserCredits(event.customer.id)
      break

    case 'payment.failed':
      // 支付失败
      await notifyUser(event.customer.email, '支付失败')
      break
  }

  return NextResponse.json({ received: true })
}
```

---

### ngrok

ngrok是一个内网穿透工具,将你本地开发环境暴露到公网。

**问题场景:**
- 你的开发服务器运行在 `localhost:3000`
- Creem服务器在云端,无法访问你的本地机器
- Webhook需要一个公网URL才能送达

**ngrok的作用:**
```
Creem服务器 → 公网URL(https://abc123.ngrok.io)
            → ngrok隧道
            → 你的localhost:3000
```

**使用方法:**

```bash
# 安装ngrok
npm install -g ngrok

# 启动隧道
ngrok http 3000

# 输出示例:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

**配置到Creem:**

在Creem后台设置webhook URL为:
```
https://abc123.ngrok.io/api/webhooks/creem
```

**注意事项:**
- ⚠️ 免费版ngrok每次重启URL会变,需要重新配置
- ⚠️ 仅用于开发测试,生产环境使用真实域名
- 💡 付费版ngrok提供固定域名

---

## 支付完整流程

### 阶段1: 用户浏览定价页面

```
用户访问 /pricing 页面
      ↓
查看不同的价格方案
      ↓
点击"立即购买"按钮
```

---

### 阶段2: 创建支付会话

**前端代码:**

```javascript
// app/pricing/page.tsx
const handlePurchase = async (planName: string, price: number) => {
  // 1. 调用你的后端API
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan: "Basic", billingCycle: "monthly" })
  })

  const data = await res.json()
  // data = { url: "https://checkout.creem.io/sess_xxx" }

  // 2. 跳转到Creem支付页面
  if (data.url) {
    window.location.href = data.url
  }
}
```

**后端代码:**

```javascript
// app/api/checkout/route.ts
export async function POST(req: NextRequest) {
  // 1. 接收前端请求
  const { plan, billingCycle } = await req.json()

  // 2. 获取对应的产品ID
  const productId = PRODUCT_IDS[plan]

  // 3. 调用Creem API创建支付会话
  const response = await fetch(`${CREEM_API_URL}/v1/checkouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CREEM_API_KEY
    },
    body: JSON.stringify({
      product_id: productId,
      metadata: { plan, billingCycle }
    })
  })

  const data = await response.json()
  // data = {
  //   id: "sess_xxx",
  //   url: "https://checkout.creem.io/sess_xxx",
  //   status: "pending"
  // }

  // 4. 返回支付URL给前端
  return NextResponse.json({ url: data.url })
}
```

---

### 阶段3: 用户在Creem页面支付

```
用户被重定向到 Creem 托管的支付页面
      ↓
Creem页面显示:
  - 产品名称和价格
  - 信用卡输入表单
  - 账单地址
      ↓
用户输入支付信息
      ↓
点击"确认支付"按钮
      ↓
Creem处理支付:
  - 验证卡片
  - 扣款
  - 生成收据
```

---

### 阶段4: 支付结果处理

#### 场景A: 同步返回(用户未关闭页面)

```
Creem支付成功
      ↓
重定向用户到成功页面
      ↓
https://你的网站.com/success?session_id=sess_xxx
      ↓
你的前端显示"支付成功"页面
```

#### 场景B: 异步通知(Webhook) - 推荐方式

```
Creem支付完成(无论用户是否在线)
      ↓
Creem服务器发送Webhook到你的服务器
      ↓
POST https://你的网站.com/api/webhooks/creem
{
  "event": "checkout.completed",
  "checkout_id": "sess_xxx",
  "customer": {
    "id": "cus_xxx",
    "email": "[email protected]"
  },
  "product_id": "prod_xxx",
  "amount": 690,
  "metadata": {
    "plan": "Basic",
    "billingCycle": "monthly"
  }
}
      ↓
你的服务器处理Webhook:
  - 验证签名
  - 发放credits
  - 更新数据库
  - 发送邮件
```

---

## 完整流程图

```
┌─────────┐
│  用户    │
└────┬────┘
     │ 1. 访问 /pricing
     ↓
┌─────────────────┐
│  Pricing 页面    │
│  选择 Basic 方案 │
└────┬────────────┘
     │ 2. 点击"立即购买"
     ↓
┌──────────────────────┐
│  前端调用             │
│  POST /api/checkout  │
└────┬─────────────────┘
     │ 3. { plan: "Basic", billingCycle: "monthly" }
     ↓
┌────────────────────────┐
│  你的服务器             │
│  /api/checkout/route.ts│
└────┬───────────────────┘
     │ 4. 创建支付会话
     ↓
┌──────────────────┐
│  Creem API       │
│  POST /checkouts │
└────┬─────────────┘
     │ 5. 返回 checkout URL
     ↓
┌──────────────────┐
│  你的服务器       │
└────┬─────────────┘
     │ 6. { url: "https://checkout.creem.io/sess_xxx" }
     ↓
┌──────────────────┐
│  前端跳转         │
└────┬─────────────┘
     │ 7. window.location.href = url
     ↓
┌──────────────────────┐
│  Creem 支付页面      │
│  用户输入卡号信息     │
└────┬─────────────────┘
     │ 8. 点击"确认支付"
     ↓
┌──────────────────┐
│  Creem 处理支付   │
│  扣款 + 验证      │
└────┬─────────────┘
     │
     ├─► 9a. 同步重定向用户
     │   https://你的网站.com/success
     │
     └─► 9b. 异步发送Webhook (可靠!)
         POST /api/webhooks/creem
              ↓
         ┌────────────────────┐
         │  你的Webhook处理器  │
         │  - 验证签名         │
         │  - 发放credits      │
         │  - 更新数据库       │
         │  - 发送邮件         │
         └────────────────────┘
```

---

## 代码实现

### 环境变量配置

在 `.env.local` 中配置:

```bash
# Creem支付配置
CREEM_TEST_MODE=true  # 设置为 false 切换到生产环境
CREEM_API_KEY=creem_test_1Zw2lDhztXT63hzqH8sCPX
CREEM_PRODUCT_HOBBY=prod_3wG4tNHMUD00HryNLYUuku
CREEM_PRODUCT_BASIC=prod_3wG4tNHMUD00HryNLYUuku
CREEM_PRODUCT_PRO=prod_3wG4tNHMUD00HryNLYUuku
```

### API端点自动切换

```javascript
// app/api/checkout/route.ts
const CREEM_TEST_MODE = process.env.CREEM_TEST_MODE === "true"
const CREEM_API_URL = CREEM_TEST_MODE
  ? "https://test-api.creem.io"
  : "https://api.creem.io"
```

### 定价页面

文件: `app/pricing/page.tsx`

- 4个定价方案: Free, Hobby, Basic, Pro
- 月付/年付切换
- 点击购买调用 `/api/checkout` API

### Checkout API

文件: `app/api/checkout/route.ts`

- 接收计划和计费周期
- 调用Creem API创建支付会话
- 返回支付URL

---

## 测试指南

### 测试环境设置

1. 确保 `CREEM_TEST_MODE=true`
2. 使用测试API密钥
3. 在Creem后台创建测试产品

### 测试卡号

**成功支付:**
```
卡号: 4242 4242 4242 4242
日期: 任意未来日期 (如: 12/28)
CVV: 任意3位数字 (如: 123)
邮编: 任意5位数字
```

**其他测试场景:**
- 支付被拒: 4000 0000 0000 0002
- 需要3D验证: 4000 0027 6000 3184

### 测试流程

1. 访问 `/pricing` 页面
2. 选择任意付费方案
3. 点击"立即购买"
4. 使用测试卡号完成支付
5. 检查控制台日志查看返回数据

### 开发环境Webhook测试

1. 安装ngrok: `npm install -g ngrok`
2. 启动ngrok: `ngrok http 3000`
3. 复制生成的URL (如: `https://abc123.ngrok.io`)
4. 在Creem后台配置webhook URL: `https://abc123.ngrok.io/api/webhooks/creem`
5. 进行测试支付,查看webhook是否收到通知

---

## 生产环境部署

### 切换到生产模式

1. 更新环境变量:
```bash
CREEM_TEST_MODE=false
CREEM_API_KEY=creem_live_xxx  # 替换为生产API key
```

2. 在Creem后台:
   - 切换到生产模式
   - 创建真实产品
   - 更新产品ID环境变量
   - 配置生产webhook URL

3. 配置真实域名的webhook URL:
```
https://你的域名.com/api/webhooks/creem
```

### 安全注意事项

- ✅ 始终验证webhook签名
- ✅ 使用HTTPS
- ✅ 不要在前端暴露API密钥
- ✅ 记录所有支付事件日志
- ✅ 实现幂等性处理(防止重复处理同一事件)

---

## 常见问题

### Q: 为什么需要Webhook而不只依赖前端跳转?

**A:** 因为:
- ✅ 用户可能关闭浏览器
- ✅ 网络可能中断
- ✅ 防止用户伪造支付成功
- ✅ 处理异步支付(银行转账可能需要几天)
- ✅ 处理订阅续费(用户不在线时也会扣款)

### Q: Test mode和Production mode有什么区别?

**A:**
- API端点不同 (test-api.creem.io vs api.creem.io)
- 使用不同的API密钥
- 数据完全隔离
- 测试模式可以使用测试卡号,不会真实扣款

### Q: 如何调试Webhook?

**A:**
1. 本地开发使用ngrok暴露本地服务器
2. 在webhook处理器中添加详细日志
3. 使用Creem后台的webhook日志查看发送历史
4. 可以在Creem后台手动重发webhook进行测试

---

## 相关资源

- [Creem官方文档](https://docs.creem.io)
- [Creem API参考](https://docs.creem.io/api-reference/introduction)
- [Creem Test Mode指南](https://docs.creem.io/getting-started/test-mode)
- [ngrok官网](https://ngrok.com)

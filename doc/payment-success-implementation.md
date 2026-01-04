# 支付成功交互实现指南(方案3)

## 已实现的功能

✅ **支付成功页面** - 美观的成功页面,实时显示订单信息
✅ **支付验证API** - 调用Creem API验证支付真实性
✅ **支付状态查询API** - 轮询webhook处理状态
✅ **Webhook处理器** - 异步接收Creem通知,发放credits
✅ **数据库集成** - payments表记录所有支付
✅ **回调URL配置** - 支付完成自动跳转成功页面

---

## 文件结构

```
banana-website-clone/
├── app/
│   ├── payment/
│   │   └── success/
│   │       └── page.tsx                    # 支付成功页面
│   └── api/
│       ├── checkout/route.ts               # 创建支付会话(已修改)
│       ├── verify-payment/route.ts         # 验证支付状态
│       ├── payment-status/route.ts         # 查询webhook处理状态
│       └── webhooks/
│           └── creem/route.ts              # Webhook处理器
├── supabase/
│   └── migrations/
│       └── create_payments_table.sql       # 数据库迁移SQL
├── .env.local                              # 环境变量(已更新)
└── .env.example                            # 环境变量示例(已更新)
```

---

## 完整流程

### 1. 用户点击支付
```
用户在 /pricing 页面点击"立即购买"
      ↓
调用 POST /api/checkout
      ↓
返回 Creem 支付URL
      ↓
跳转到 Creem 支付页面
```

### 2. 支付完成后
```
Creem 处理支付
      ↓
重定向到: /payment/success?session_id=sess_xxx
      ↓
前端显示"验证支付信息..."加载状态
```

### 3. 前端验证支付
```
调用 GET /api/verify-payment?session_id=sess_xxx
      ↓
后端查询 Creem API
      ↓
验证支付状态
      ↓
返回订单信息 { success: true, order: {...} }
      ↓
前端显示"支付成功"页面
```

### 4. 等待Webhook处理
```
前端每3秒轮询 GET /api/payment-status?session_id=sess_xxx
      ↓
查询 payments 表
      ↓
检查 webhook 是否已处理
      ↓
如果未处理: 显示"正在处理..."
如果已处理: 显示"Credits已到账!"
```

### 5. Webhook异步处理
```
Creem 发送 webhook 到 /api/webhooks/creem
      ↓
验证事件类型: checkout.completed
      ↓
保存支付记录到 payments 表
      ↓
查找用户并发放 credits
      ↓
(可选)发送确认邮件
      ↓
返回 { received: true }
```

---

## 部署步骤

### 步骤1: 创建Supabase数据库表

1. 登录Supabase Dashboard
2. 进入SQL Editor
3. 执行 `supabase/migrations/create_payments_table.sql` 中的SQL

或使用Supabase CLI:
```bash
supabase migration up
```

验证表创建成功:
```sql
SELECT * FROM payments LIMIT 1;
```

---

### 步骤2: 配置环境变量

在 `.env.local` 中添加:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 本地开发
# 生产环境: NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

### 步骤3: 本地测试

1. 启动开发服务器:
```bash
pnpm dev
```

2. 访问 `http://localhost:3000/pricing`

3. 选择任意付费方案,点击"立即购买"

4. 使用测试卡号:
   - 卡号: `4242 4242 4242 4242`
   - 日期: 任意未来日期
   - CVV: 任意3位数字

5. 支付成功后应该:
   - ✅ 跳转到 `/payment/success?session_id=xxx`
   - ✅ 显示订单信息
   - ✅ 显示"正在处理..."(因为本地webhook无法接收)

---

### 步骤4: 配置ngrok(本地测试Webhook)

Webhook需要公网URL才能接收,本地开发使用ngrok:

1. 安装ngrok:
```bash
npm install -g ngrok
```

2. 启动ngrok:
```bash
ngrok http 3000
```

3. 复制生成的URL(如 `https://abc123.ngrok.io`)

4. 在Creem Dashboard配置webhook:
   - URL: `https://abc123.ngrok.io/api/webhooks/creem`
   - Events: `checkout.completed`, `payment.succeeded`

5. 再次测试支付,现在应该看到:
   - ✅ "正在处理..." → "Credits已到账!"
   - ✅ 终端输出webhook日志
   - ✅ Supabase payments表有新记录

---

### 步骤5: 生产环境部署

#### 5.1 更新环境变量

在Vercel/生产环境配置:
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
CREEM_TEST_MODE=false
CREEM_API_KEY=creem_live_xxx  # 生产API key
CREEM_PRODUCT_HOBBY=prod_live_xxx
CREEM_PRODUCT_BASIC=prod_live_xxx
CREEM_PRODUCT_PRO=prod_live_xxx
```

#### 5.2 配置生产Webhook

在Creem Dashboard配置:
```
Webhook URL: https://yourdomain.com/api/webhooks/creem
Events: checkout.completed, payment.succeeded, subscription.renewed
```

#### 5.3 测试生产环境

1. 使用真实卡号测试(或继续使用测试卡号如果Creem支持)
2. 检查webhook日志
3. 验证credits是否正确发放

---

## 用户体验流程

### 成功支付的完整体验:

```
1. 点击"立即购买"
   ↓
2. 跳转到Creem支付页面
   ↓
3. 输入卡号信息
   ↓
4. 点击"确认支付"
   ↓
5. 跳转回网站 /payment/success
   ↓
6. 显示"验证支付信息..." (1-2秒)
   ↓
7. 显示支付成功页面:
   ✅ 支付成功!
   订单号: #ORD-xxx
   方案: Basic Plan
   金额: $6.9/月
   Credits: 400

   [正在处理...]
   我们正在为您的账户发放Credits,请稍候
   ↓
8. 3-10秒后(webhook处理完成):
   ✅ Credits已到账!
   您现在可以开始使用AI图像编辑功能了

   [开始使用] [查看其他方案]
```

---

## API端点说明

### POST /api/checkout
创建支付会话

**请求:**
```json
{
  "plan": "Basic",
  "billingCycle": "monthly"
}
```

**响应:**
```json
{
  "url": "https://checkout.creem.io/sess_xxx"
}
```

---

### GET /api/verify-payment
验证支付状态

**请求:**
```
GET /api/verify-payment?session_id=sess_xxx
```

**响应(成功):**
```json
{
  "success": true,
  "order": {
    "id": "sess_xxx",
    "plan": "Basic",
    "amount": "6.90",
    "credits": 400,
    "billingCycle": "monthly"
  }
}
```

**响应(失败):**
```json
{
  "success": false,
  "message": "支付未完成,当前状态: pending"
}
```

---

### GET /api/payment-status
查询webhook处理状态

**请求:**
```
GET /api/payment-status?session_id=sess_xxx
```

**响应(未处理):**
```json
{
  "webhookProcessed": false,
  "message": "等待处理中"
}
```

**响应(已处理):**
```json
{
  "webhookProcessed": true,
  "payment": {
    "id": "uuid",
    "status": "completed",
    "creditsGranted": 400,
    "createdAt": "2026-01-03T10:00:00Z"
  }
}
```

---

### POST /api/webhooks/creem
接收Creem webhook

**请求(由Creem发送):**
```json
{
  "type": "checkout.completed",
  "data": {
    "id": "sess_xxx",
    "customer": {
      "email": "[email protected]"
    },
    "amount": 690,
    "metadata": {
      "plan": "Basic",
      "billingCycle": "monthly"
    }
  }
}
```

**处理逻辑:**
1. 保存支付记录到 `payments` 表
2. 查找用户并增加 `credits`
3. (可选)发送确认邮件

---

## 数据库Schema

### payments表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | TEXT | Creem会话ID(唯一) |
| customer_email | TEXT | 客户邮箱 |
| plan | TEXT | 计划名称 |
| billing_cycle | TEXT | 计费周期 |
| amount | DECIMAL | 支付金额 |
| credits_granted | INTEGER | 发放的Credits |
| status | TEXT | 状态(completed/failed) |
| webhook_data | JSONB | Webhook原始数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## 故障排查

### 问题1: 支付成功但没跳转

**可能原因:**
- `NEXT_PUBLIC_SITE_URL` 未配置
- Creem未收到 `success_url` 参数

**解决:**
1. 检查 `.env.local` 中 `NEXT_PUBLIC_SITE_URL`
2. 重启开发服务器
3. 查看 `/api/checkout` 日志,确认发送了 `success_url`

---

### 问题2: 显示"验证支付失败"

**可能原因:**
- session_id无效
- Creem API返回错误

**解决:**
1. 检查URL中的 `session_id` 参数
2. 查看 `/api/verify-payment` 日志
3. 检查 `CREEM_API_KEY` 是否正确

---

### 问题3: Webhook一直显示"正在处理..."

**可能原因:**
- 本地开发未使用ngrok
- Webhook URL配置错误
- Creem未发送webhook

**解决:**
1. 本地开发启动ngrok
2. 在Creem Dashboard检查webhook配置
3. 查看Creem Dashboard的webhook日志
4. 检查 `/api/webhooks/creem` 是否收到请求

---

### 问题4: Credits未发放

**可能原因:**
- users表中没有对应邮箱的用户
- Webhook处理逻辑出错

**解决:**
1. 查看 `/api/webhooks/creem` 日志
2. 检查 Supabase `payments` 表是否有记录
3. 检查用户邮箱是否匹配

---

## 安全注意事项

### 生产环境必须实现:

1. **Webhook签名验证**
```javascript
// app/api/webhooks/creem/route.ts
const signature = req.headers.get("x-creem-signature")
if (!verifySignature(signature, event)) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
}
```

2. **防止重复处理**
- 数据库 `session_id` 字段设置为唯一约束
- 检查是否已处理过该支付

3. **幂等性**
- 同一webhook可能被发送多次
- 确保多次处理不会导致重复发放credits

4. **日志记录**
- 记录所有支付事件
- 便于审计和故障排查

---

## 下一步优化

- [ ] 添加邮件通知功能
- [ ] 实现退款处理
- [ ] 添加订阅管理页面
- [ ] 实现credits消费记录
- [ ] 添加发票生成功能
- [ ] 实现支付失败重试机制

---

## 相关文档

- [Creem支付集成指南](./creem-payment-guide.md)
- [Creem官方文档](https://docs.creem.io)

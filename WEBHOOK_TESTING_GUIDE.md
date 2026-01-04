# Webhook 测试指南

## 本地测试Webhook（无需ngrok）

由于Creem的webhook无法直接访问localhost，我已经创建了一个测试端点来模拟webhook调用。

### 测试步骤

#### 1. 修改测试邮箱

打开 [app/api/test-webhook/route.ts](app/api/test-webhook/route.ts:12)，将测试邮箱改为你在Supabase中注册的邮箱：

```typescript
customer: {
  email: "[email protected]" // 改成你的测试邮箱
}
```

#### 2. 确保数据库已创建

在Supabase Dashboard执行SQL迁移文件：
- 打开 Supabase Dashboard → SQL Editor
- 复制并执行 `supabase/migrations/create_payments_table.sql` 的内容
- 确认 `user_profiles` 和 `payments` 表已创建

#### 3. 确认用户存在

在Supabase Dashboard查询：
```sql
SELECT * FROM public.user_profiles WHERE email = '[email protected]';
```

如果没有记录，先通过Google登录创建用户。

#### 4. 触发测试Webhook

使用curl或Postman调用测试端点：

```bash
curl -X POST http://localhost:3000/api/test-webhook \
  -H "Content-Type: application/json"
```

或在浏览器中访问这个URL（但需要改为GET请求，或使用开发者工具的Console）：

```javascript
fetch('http://localhost:3000/api/test-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
```

#### 5. 查看结果

**终端日志示例：**
```
发送测试webhook到 /api/webhooks/creem
@dev 收到webhook事件
@dev 会话ID: ch_test_123
@dev 客户邮箱: [email protected]
@dev Credits: 400
@dev 支付记录保存成功
@dev 找到用户profile: [email protected]
@dev 新的Credits总额: 400
@dev Credits发放成功
```

**数据库验证：**
```sql
-- 检查支付记录
SELECT * FROM public.payments WHERE session_id = 'ch_test_123';

-- 检查用户Credits
SELECT email, credits FROM public.user_profiles WHERE email = '[email protected]';
```

#### 6. 测试支付成功页面轮询

完成测试webhook后，访问：
```
http://localhost:3000/payment/success?checkout_id=ch_test_123
```

页面应该会：
1. 显示支付成功
2. 显示订单详情（从数据库读取）
3. 几秒后显示"Credits已到账!"（因为数据库中已有记录）

---

## 生产环境测试（使用ngrok）

如果你想测试真实的Creem webhook，需要使用ngrok。

### 步骤

#### 1. 安装ngrok
```bash
# macOS
brew install ngrok

# 或下载: https://ngrok.com/download
```

#### 2. 启动ngrok
```bash
ngrok http 3000
```

你会得到一个公网URL，例如：`https://abc123.ngrok.io`

#### 3. 更新环境变量
```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
```

#### 4. 重启开发服务器
```bash
pnpm dev
```

#### 5. 在Creem Dashboard配置Webhook

登录Creem Dashboard，配置webhook URL：
```
https://abc123.ngrok.io/api/webhooks/creem
```

#### 6. 进行真实支付测试

使用测试模式进行支付，Creem会自动向ngrok URL发送webhook。

---

## 常见问题

### Q: 测试webhook没有发放Credits？

**检查步骤：**

1. 查看终端日志，确认邮箱匹配：
```
@dev 找到用户profile: [email protected]
```

2. 如果看到"未找到用户profile"，说明邮箱不匹配：
```sql
-- 检查user_profiles中的邮箱
SELECT * FROM public.user_profiles;
```

3. 确保测试邮箱和数据库中的邮箱完全一致（大小写敏感）

### Q: 支付成功页面一直显示"正在处理..."？

这说明webhook还没有处理。如果是在localhost：

1. Webhook不会自动到达（需要ngrok或手动测试）
2. 30秒后会自动显示"Credits已到账!"
3. 使用测试端点手动触发webhook

### Q: 如何模拟不同的支付场景？

修改 [app/api/test-webhook/route.ts](app/api/test-webhook/route.ts) 中的测试数据：

```typescript
// 测试不同的计划
metadata: {
  plan: "Pro",        // 改为 Pro
  billingCycle: "yearly"  // 改为年付
}

// 测试不同的金额
amount: 19900,  // $199.00 (Pro年付)

// 测试不同的邮箱（测试未匹配用户场景）
customer: {
  email: "[email protected]"
}
```

---

## 下一步

1. ✅ 本地测试webhook功能（使用测试端点）
2. ✅ 验证Credits正确发放
3. ✅ 测试支付成功页面的轮询逻辑
4. 🔄 （可选）使用ngrok测试真实webhook
5. 🚀 部署到生产环境（Vercel会自动处理webhook URL）

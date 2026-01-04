# 支付与用户关联架构说明

## 数据库架构

### 表结构关系

```
auth.users (Supabase内置认证表)
    ↓ (1对1关系)
public.user_profiles (用户扩展信息)
    ↓ (1对多关系)
public.payments (支付记录)
```

---

## 表详细说明

### 1. auth.users
**Supabase内置表,自动管理**
- 存储用户认证信息(email, password_hash等)
- Google登录后自动创建记录
- 由Supabase Auth自动维护

### 2. public.user_profiles
**用户扩展资料表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键,关联auth.users.id |
| email | TEXT | 用户邮箱 |
| credits | INTEGER | 用户拥有的Credits余额 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**特点:**
- ✅ 与auth.users是1对1关系
- ✅ 用户注册时自动创建(通过trigger)
- ✅ 存储业务相关数据(credits等)
- ✅ 有RLS策略保护,用户只能看自己的数据

### 3. public.payments
**支付记录表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | TEXT | Creem会话ID(唯一) |
| user_id | UUID | 关联user_profiles.id |
| customer_email | TEXT | 支付时的邮箱 |
| plan | TEXT | 购买的计划 |
| billing_cycle | TEXT | 计费周期 |
| amount | DECIMAL | 支付金额 |
| credits_granted | INTEGER | 发放的Credits |
| status | TEXT | 支付状态 |
| webhook_data | JSONB | 原始webhook数据 |

**特点:**
- ✅ 记录所有支付历史
- ✅ 通过user_id关联到用户
- ✅ 通过customer_email匹配用户
- ✅ 防止重复处理(session_id唯一约束)

---

## 数据流程

### 用户注册流程
```
1. 用户通过Google登录
   ↓
2. Supabase在auth.users创建记录
   ↓
3. Trigger自动在user_profiles创建对应记录
   (id相同, email相同, credits=0)
```

### 支付流程
```
1. 已登录用户点击购买
   ↓
2. 跳转到Creem支付页面
   ↓
3. 用户输入支付信息(可能是不同的邮箱!)
   ↓
4. 支付成功,Creem发送webhook
   ↓
5. Webhook处理器:
   - 保存记录到payments表
   - 通过customer_email查找user_profiles
   - 如果找到,增加credits并关联user_id
   - 如果未找到,仅保存支付记录
```

### 关键场景处理

#### 场景1: 已登录用户,使用相同邮箱支付
```
用户邮箱: [email protected]
支付邮箱: [email protected]

结果:
✅ payments表有记录
✅ user_id正确关联
✅ credits自动发放
```

#### 场景2: 已登录用户,使用不同邮箱支付
```
用户邮箱: [email protected]
支付邮箱: [email protected]

结果:
✅ payments表有记录
⚠️ user_id=NULL(未找到匹配用户)
❌ credits未发放

解决方案:
需要手动关联或要求用户使用注册邮箱支付
```

#### 场景3: 未登录用户支付
```
用户状态: 未登录
支付邮箱: [email protected]

结果:
✅ payments表有记录
⚠️ user_id=NULL
❌ credits未发放

解决方案:
用户注册后,通过邮箱匹配并发放credits
```

---

## 自动化触发器

### 1. 新用户自动创建Profile
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**功能:**
- auth.users有新记录时自动触发
- 在user_profiles创建对应记录
- 初始credits=0

### 2. 自动更新时间戳
```sql
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  EXECUTE FUNCTION public.update_updated_at_column();
```

**功能:**
- 任何更新时自动设置updated_at = NOW()

---

## Row Level Security (RLS) 策略

### user_profiles表

```sql
-- 用户只能查看自己的profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 用户可以更新自己的profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### payments表

```sql
-- 用户可以查看自己的支付记录
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role可以插入/更新(用于webhook)
CREATE POLICY "Service role can insert payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (true);
```

**说明:**
- 前端用户只能访问自己的数据
- Webhook使用Service Role Key,绕过RLS
- 安全性得到保障

---

## API代码适配

### Webhook处理器更新

**旧代码:**
```javascript
// ❌ 旧的实现(users表不存在)
const { data: users } = await supabase
  .from("users")
  .select("id, credits")
  .eq("email", customerEmail)
```

**新代码:**
```javascript
// ✅ 新的实现(使用user_profiles)
const { data: profiles } = await supabase
  .from("user_profiles")
  .select("id, email, credits")
  .eq("email", customerEmail)

if (profiles && profiles.length > 0) {
  const profile = profiles[0]
  const newCredits = profile.credits + credits

  // 更新credits
  await supabase
    .from("user_profiles")
    .update({ credits: newCredits })
    .eq("id", profile.id)

  // 关联payment记录
  await supabase
    .from("payments")
    .update({ user_id: profile.id })
    .eq("id", payment.id)
}
```

---

## 查询示例

### 查询用户余额
```sql
SELECT email, credits
FROM public.user_profiles
WHERE id = 'user-uuid-here';
```

### 查询用户所有支付记录
```sql
SELECT
  p.created_at,
  p.plan,
  p.amount,
  p.credits_granted,
  p.status
FROM public.payments p
WHERE p.user_id = 'user-uuid-here'
ORDER BY p.created_at DESC;
```

### 查询未关联用户的支付记录
```sql
SELECT
  session_id,
  customer_email,
  credits_granted,
  created_at
FROM public.payments
WHERE user_id IS NULL
  AND status = 'completed';
```

### 手动关联未匹配的支付
```sql
-- 1. 找到用户ID
SELECT id FROM public.user_profiles WHERE email = '[email protected]';

-- 2. 更新payment记录
UPDATE public.payments
SET user_id = 'found-user-id'
WHERE customer_email = '[email protected]'
  AND user_id IS NULL;

-- 3. 发放credits
UPDATE public.user_profiles
SET credits = credits + 400
WHERE id = 'found-user-id';
```

---

## 最佳实践

### 1. 要求用户使用注册邮箱支付
在支付页面提示:
```
"请使用您的注册邮箱 [email protected] 进行支付,
以确保Credits自动到账"
```

### 2. 支付前验证登录状态
```javascript
// app/pricing/page.tsx
const handlePurchase = async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 跳转到登录页面
    router.push('/auth/signin')
    return
  }

  // 继续支付流程...
}
```

### 3. 定期检查未匹配的支付
创建一个后台任务,定期检查 `user_id IS NULL` 的支付记录,尝试匹配用户。

---

## 故障排查

### 问题: Credits未自动发放

**检查步骤:**

1. 检查payments表是否有记录:
```sql
SELECT * FROM public.payments
WHERE session_id = 'sess_xxx';
```

2. 检查customer_email是否匹配:
```sql
SELECT * FROM public.user_profiles
WHERE email = '[email protected]';
```

3. 检查webhook日志:
```bash
# 查看终端输出
@dev 未找到用户profile: [email protected]
```

**常见原因:**
- 支付邮箱与注册邮箱不一致
- user_profiles表中没有该用户
- Webhook未正确处理

---

## 下一步优化

- [ ] 添加手动关联支付的管理界面
- [ ] 发送邮件提醒用户使用正确邮箱
- [ ] 实现邮箱验证机制
- [ ] 添加credits消费记录表
- [ ] 实现credits转账功能

---

## 相关文件

- SQL迁移: `supabase/migrations/create_payments_table.sql`
- Webhook处理器: `app/api/webhooks/creem/route.ts`
- 支付状态查询: `app/api/payment-status/route.ts`

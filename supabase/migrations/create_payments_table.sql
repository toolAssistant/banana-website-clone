-- ============================================
-- Payments Tracking and Credits Integration
-- ============================================

-- 1. 创建 user_profiles 表(扩展 auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 payments 表用于记录所有支付
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  customer_email TEXT,
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  credits_granted INTEGER NOT NULL,
  status TEXT NOT NULL,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引以加快查询
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON public.payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 4. 创建触发器:自动创建用户profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 当有新用户注册时自动创建profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. 创建触发器:更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. 为已存在的auth.users创建profiles
INSERT INTO public.user_profiles (id, email, credits)
SELECT id, email, 0
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Row Level Security (RLS) 策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 用户可以更新自己的profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 用户可以查看自己的支付记录
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role可以插入支付记录(用于webhook)
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
CREATE POLICY "Service role can insert payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (true);

-- Service role可以更新支付记录
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;
CREATE POLICY "Service role can update payments"
  ON public.payments
  FOR UPDATE
  USING (true);

-- 8. 添加注释
COMMENT ON TABLE public.user_profiles IS '用户资料表,扩展auth.users,存储credits等信息';
COMMENT ON TABLE public.payments IS '支付记录表';
COMMENT ON COLUMN public.payments.session_id IS 'Creem支付会话ID';
COMMENT ON COLUMN public.payments.user_id IS '关联的用户ID';
COMMENT ON COLUMN public.payments.customer_email IS '客户邮箱';
COMMENT ON COLUMN public.payments.plan IS '购买的计划(Hobby/Basic/Pro)';
COMMENT ON COLUMN public.payments.billing_cycle IS '计费周期(monthly/yearly)';
COMMENT ON COLUMN public.payments.amount IS '支付金额(美元)';
COMMENT ON COLUMN public.payments.credits_granted IS '发放的Credits数量';
COMMENT ON COLUMN public.payments.status IS '支付状态(pending/completed/failed)';
COMMENT ON COLUMN public.payments.webhook_data IS 'Creem webhook原始数据';

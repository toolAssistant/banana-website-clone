# Supabase Google 登录设置指南

本指南将帮助你配置 Supabase 的 Google OAuth 登录功能。

## 前置要求

- Supabase 项目
- Google Cloud Platform 账号

## 步骤 1: 在 Google Cloud 创建 OAuth 应用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建一个新项目或选择现有项目
3. 导航到 **APIs & Services** > **Credentials**
4. 点击 **Create Credentials** > **OAuth 2.0 Client ID**
5. 如果是首次创建，需要先配置 OAuth consent screen：
   - 选择 **External** 用户类型
   - 填写应用名称、用户支持电子邮件等必要信息
   - 添加测试用户（开发阶段）
6. 创建 OAuth 2.0 Client ID：
   - Application type: **Web application**
   - Name: 自定义名称（如 "Nano Banana"）
   - Authorized JavaScript origins:
     - `http://localhost:3000` (开发环境)
     - `https://yourdomain.com` (生产环境)
   - Authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - 将 `<your-project-ref>` 替换为你的 Supabase 项目引用 ID

7. 创建后，复制 **Client ID** 和 **Client Secret**

## 步骤 2: 在 Supabase 中配置 Google Provider

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 导航到 **Authentication** > **Providers**
4. 找到 **Google** 并点击
5. 启用 Google provider
6. 填入从 Google Cloud 获取的：
   - **Client ID**
   - **Client Secret**
7. 点击 **Save**

## 步骤 3: 配置环境变量

在项目根目录创建 `.env.local` 文件（如果还没有）：

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (已有)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_DEBUG=false
\`\`\`

你可以在 Supabase Dashboard 的 **Settings** > **API** 中找到这些值。

## 步骤 4: 测试登录

1. 启动开发服务器：
   \`\`\`bash
   pnpm dev
   \`\`\`

2. 访问 http://localhost:3000
3. 点击 **登录** 按钮
4. 选择 **使用 Google 登录**
5. 使用你的 Google 账号完成授权

## 文件结构

实现的认证相关文件：

\`\`\`
lib/supabase/
  ├── server.ts              # 服务器端 Supabase 客户端
  ├── client.ts              # 浏览器端 Supabase 客户端
  └── middleware.ts          # 认证中间件

app/
  ├── actions/auth.ts        # 登录/登出 Server Actions
  ├── api/auth/callback/     # OAuth 回调处理
  └── auth/
      ├── signin/            # 登录页面
      └── auth-code-error/   # 认证错误页面

components/
  ├── header.tsx             # 更新了认证状态显示
  └── user-nav.tsx           # 用户导航菜单

middleware.ts                # Next.js 中间件
\`\`\`

## 重要配置点

### 1. 回调 URL 配置

确保在 Google Cloud Console 中的 Authorized redirect URIs 包含：
\`\`\`
https://<your-project-ref>.supabase.co/auth/v1/callback
\`\`\`

### 2. Middleware 配置

项目中的 `middleware.ts` 会自动处理 Supabase 的会话管理，确保在每个请求中更新用户状态。

### 3. 服务器端认证

所有认证操作都使用服务器端方式，通过 Server Actions 和 Server Components 实现，确保安全性。

## 常见问题

### 1. 重定向 URL 不匹配
**错误**: `redirect_uri_mismatch`

**解决**: 确保 Google Cloud Console 中的 Authorized redirect URIs 完全匹配 Supabase 提供的回调 URL。

### 2. 认证后无法跳转
**解决**: 检查 `app/api/auth/callback/route.ts` 中的逻辑，确保环境变量正确设置。

### 3. 用户信息未显示
**解决**: 检查 `components/user-nav.tsx`，确保从 `user.user_metadata` 正确读取 Google 返回的用户信息。

## 生产环境部署

部署到生产环境时：

1. 在 Google Cloud Console 添加生产域名到 Authorized JavaScript origins
2. 更新环境变量为生产环境的值
3. 确保 HTTPS 已启用
4. 在 Supabase 中设置生产环境的 Site URL（Settings > General）

## 安全建议

- ✅ 使用服务器端认证（已实现）
- ✅ 通过 middleware 管理会话（已实现）
- ✅ 环境变量不提交到版本控制（.env.local 在 .gitignore 中）
- 🔒 生产环境启用 HTTPS
- 🔒 定期轮换 API 密钥
- 🔒 启用 Supabase 的 Email Confirmations（可选）

## 进一步优化

可选的功能增强：

1. **会话管理**: 添加会话过期提醒
2. **用户资料**: 创建用户资料页面
3. **权限管理**: 实现基于角色的访问控制
4. **多提供商**: 添加其他登录方式（GitHub, Discord 等）
5. **分析追踪**: 集成登录事件追踪

## 参考文档

- [Supabase Google Auth 文档](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase 服务器端认证](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

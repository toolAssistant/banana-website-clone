# 生产环境部署检查清单

## 🔧 修复说明

已修复生产环境 OAuth 回调重定向到 localhost 的问题。新的回调逻辑现在支持：
- ✅ Vercel 自动检测
- ✅ Netlify 自动检测
- ✅ 自托管环境配置
- ✅ 多层回退机制

## 📋 部署前检查清单

### 1. Supabase 配置

- [ ] **Site URL 设置**
  - 位置: Supabase Dashboard → Settings → General → Site URL
  - 值: `https://yourdomain.com`（你的生产域名）

- [ ] **Redirect URLs 配置**
  - 位置: Supabase Dashboard → Authentication → URL Configuration
  - 添加:
    ```
    http://localhost:3000/**
    https://yourdomain.com/**
    https://*.vercel.app/**
    ```

### 2. Google Cloud Console 配置

- [ ] **Authorized JavaScript origins**
  - `https://yourdomain.com`
  - `http://localhost:3000`（开发环境）

- [ ] **Authorized redirect URIs**
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`
  - ⚠️ **不是**你的域名，是 Supabase 的回调 URL

### 3. 环境变量配置

#### Vercel 部署

- [ ] 进入 Vercel Dashboard → Settings → Environment Variables
- [ ] 添加以下变量（Production）:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  OPENROUTER_API_KEY=sk-or-v1-...
  ```
- [ ] （可选）如果仍有问题，添加:
  ```
  NEXT_PUBLIC_SITE_URL=https://yourdomain.com
  ```

#### Netlify 部署

- [ ] 进入 Netlify Dashboard → Site settings → Environment variables
- [ ] 添加:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  OPENROUTER_API_KEY=sk-or-v1-...
  NEXT_PUBLIC_SITE_URL=https://yoursite.netlify.app
  ```

#### 其他平台

- [ ] 设置所有必需的环境变量
- [ ] **必须**设置 `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
- [ ] 配置反向代理 headers（见下方）

### 4. 代码更新

- [ ] 确认已更新 `app/api/auth/callback/route.ts`（新的回退逻辑）
- [ ] 本地测试构建成功: `pnpm build`
- [ ] 提交并推送代码到 Git

### 5. 部署

- [ ] 推送代码到生产分支
- [ ] 等待自动部署完成
- [ ] 检查部署日志无错误

### 6. 生产环境测试

- [ ] 访问生产网站
- [ ] 点击"登录"按钮
- [ ] 选择"使用 Google 登录"
- [ ] 完成 Google 授权
- [ ] **验证**: 登录后重定向到 `https://yourdomain.com/`（不是 localhost）
- [ ] **验证**: Header 显示用户头像和信息
- [ ] 点击用户头像，验证下拉菜单显示
- [ ] 点击"退出登录"，验证成功登出

## 🔍 故障排查

### 场景 1: 仍然重定向到 localhost

**检查步骤**:
1. Vercel Dashboard → Deployments → Functions → 查看日志
2. 确认环境变量已正确设置并重新部署
3. 检查 `x-forwarded-host` header 是否存在

**临时修复**:
添加环境变量 `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

### 场景 2: 认证后显示错误页面

**可能原因**:
- Google Cloud Console 的 redirect URI 不正确
- Supabase 配置错误

**检查**:
1. 确认 Google Authorized redirect URIs 是 Supabase URL
2. 检查 Supabase Site URL 配置

### 场景 3: 无法获取用户信息

**检查**:
1. Supabase 环境变量是否正确
2. Google OAuth Consent Screen 配置的 Scopes

## 📊 验证方法

### 浏览器开发者工具检查

1. 打开 Network 标签
2. 执行登录流程
3. 找到 `/api/auth/callback?code=...` 请求
4. 查看 Response Headers 的 `Location`
5. 应该是: `https://yourdomain.com/`

### 服务器日志检查（可选）

在 `app/api/auth/callback/route.ts` 添加临时日志:

\`\`\`typescript
export async function GET(request: Request) {
  console.log('Callback Headers:', {
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    'host': request.headers.get('host'),
  })

  // ... 其余代码
}
\`\`\`

查看 Vercel Functions 日志或服务器日志。

## 🚀 自托管环境额外配置

### Nginx 配置

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # 重要: 设置这些 headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # WebSocket 支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

### Caddy 配置

\`\`\`
yourdomain.com {
    reverse_proxy localhost:3000
    # Caddy 自动设置必要的 headers
}
\`\`\`

### Apache 配置

\`\`\`apache
<VirtualHost *:443>
    ServerName yourdomain.com

    # SSL 配置
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # 设置必要的 headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "%{HTTP_HOST}e"
</VirtualHost>
\`\`\`

## 📝 环境变量参考

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 | `eyJ...` |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API 密钥 | `sk-or-v1-...` |
| `NEXT_PUBLIC_SITE_URL` | 🔶 | 生产站点 URL（备用） | `https://yourdomain.com` |
| `VERCEL_URL` | 🔶 | Vercel 自动提供 | 自动设置 |

**图例**:
- ✅ 必需
- 🔶 可选（Vercel 不需要，其他平台建议设置）

## ✅ 成功标志

部署成功后，你应该看到：

1. **登录流程**:
   ```
   你的网站 → 登录页 → Google 授权 → Supabase → 回调处理 → 你的网站首页
   ```

2. **URL 变化**:
   ```
   https://yourdomain.com
   → https://yourdomain.com/auth/signin
   → https://accounts.google.com/...
   → https://xxx.supabase.co/auth/v1/callback
   → https://yourdomain.com/api/auth/callback?code=...
   → https://yourdomain.com/  ✅ (成功)
   ```

3. **用户界面**:
   - Header 显示用户头像
   - 点击头像显示用户名、邮箱
   - 退出登录功能正常

## 🎯 下一步

部署成功后，可以考虑：

- [ ] 设置自定义域名
- [ ] 启用 Supabase 邮箱确认
- [ ] 配置 SMTP 发送邮件
- [ ] 添加用户资料页面
- [ ] 实现图片历史记录
- [ ] 设置使用限额

## 📚 相关文档

- [PRODUCTION_FIX.md](./PRODUCTION_FIX.md) - 详细修复说明
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 初始配置
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 功能实现总结

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [PRODUCTION_FIX.md](./PRODUCTION_FIX.md) 的故障排查部分
2. 检查 Vercel/平台的部署日志
3. 确认所有配置清单项目都已完成
4. 在 Supabase Community 或 GitHub Issues 寻求帮助

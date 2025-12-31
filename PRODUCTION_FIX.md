# 生产环境 OAuth 回调修复指南

## 问题描述

在生产环境中，Google 登录后重定向到 `http://localhost:3000/?code=...` 而不是实际的生产域名。

## 根本原因

Supabase OAuth 回调时，Next.js 的 `request.url` 的 origin 可能不是实际的生产域名，导致重定向 URL 错误。

## 解决方案

已更新 `app/api/auth/callback/route.ts`，增加了多层回退机制来获取正确的主机名：

1. **开发环境**: 直接使用 `http://localhost:3000`
2. **生产环境**（按优先级）:
   - `x-forwarded-host` + `x-forwarded-proto` headers（Vercel/Netlify 等平台）
   - `host` header
   - `NEXT_PUBLIC_SITE_URL` 环境变量
   - `VERCEL_URL` 环境变量（Vercel 自动提供）
   - 最后备用：request URL 的 origin

## 配置步骤

### 方案 1：依赖平台自动设置（推荐 - Vercel）

如果你部署在 Vercel 上，**不需要额外配置**。Vercel 会自动设置：
- `x-forwarded-host`
- `x-forwarded-proto`
- `VERCEL_URL`

代码会自动使用这些值。

### 方案 2：手动设置环境变量（其他平台）

在你的生产环境中添加环境变量：

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**重要**：不要在末尾加 `/`

### Vercel 部署配置

1. 进入 Vercel Dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 确认或添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. （可选）如果仍有问题，添加：
   ```
   NEXT_PUBLIC_SITE_URL=https://your-custom-domain.com
   ```

### Netlify 部署配置

1. 进入 Netlify Dashboard
2. Site settings → Environment variables
3. 添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=https://yoursite.netlify.app
   ```

### 自托管部署

确保反向代理（Nginx/Caddy）设置了正确的 headers：

**Nginx 配置**：
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**Caddy 配置**：
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```
（Caddy 自动设置这些 headers）

## 验证修复

### 1. 检查请求 Headers（调试）

临时在 `app/api/auth/callback/route.ts` 第 4 行后添加：

```typescript
export async function GET(request: Request) {
  // 临时调试代码
  console.log('=== Debug Info ===')
  console.log('x-forwarded-host:', request.headers.get('x-forwarded-host'))
  console.log('x-forwarded-proto:', request.headers.get('x-forwarded-proto'))
  console.log('host:', request.headers.get('host'))
  console.log('VERCEL_URL:', process.env.VERCEL_URL)
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
  console.log('==================')

  const requestUrl = new URL(request.url)
  // ... 其余代码
}
```

查看 Vercel Logs 或服务器日志，确认这些值是否正确。

### 2. 测试登录流程

1. 访问生产环境网站
2. 点击"登录"
3. 使用 Google 登录
4. **验证**：登录后应该回到 `https://yourdomain.com/`（而不是 localhost）

### 3. 检查重定向 URL

在浏览器开发者工具中：
- Network 标签
- 找到 `/api/auth/callback?code=...` 请求
- 查看 Response Headers 中的 `Location`
- 应该是 `https://yourdomain.com/`

## 常见问题

### Q: 仍然重定向到 localhost
**A**:
1. 确认环境变量已部署（重新部署后生效）
2. 检查平台是否设置了 `x-forwarded-host`
3. 手动设置 `NEXT_PUBLIC_SITE_URL`

### Q: Vercel 预览部署也要配置吗？
**A**: 不需要。Vercel 预览部署会自动使用预览 URL（如 `your-app-xxx.vercel.app`）

### Q: 使用自定义域名需要特殊配置吗？
**A**:
- **Vercel**: 自动处理，无需配置
- **其他平台**: 设置 `NEXT_PUBLIC_SITE_URL=https://custom-domain.com`

### Q: 开发环境会受影响吗？
**A**: 不会。代码会检测 `NODE_ENV === 'development'` 并强制使用 `http://localhost:3000`

## Google Cloud Console 配置

确保 Authorized redirect URIs 包含：

```
https://your-project-ref.supabase.co/auth/v1/callback
```

**不要**添加你的生产域名到 redirect URIs，因为 Google → Supabase → 你的网站这个流程中，Google 只会重定向到 Supabase。

## Supabase 配置

### Site URL 设置

1. Supabase Dashboard → Settings → General
2. Site URL: 设置为你的生产域名
   ```
   https://yourdomain.com
   ```

### Redirect URLs 设置

1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs 添加：
   ```
   http://localhost:3000/**        # 开发环境
   https://yourdomain.com/**       # 生产环境
   https://*.vercel.app/**         # Vercel 预览部署（可选）
   ```

## 验证清单

- [ ] 生产环境环境变量已设置
- [ ] Supabase Site URL 已配置为生产域名
- [ ] Supabase Redirect URLs 包含生产域名
- [ ] Google Cloud Console Authorized redirect URIs 正确
- [ ] 重新部署应用
- [ ] 测试登录流程完整
- [ ] 确认重定向到正确的生产 URL

## 调试技巧

如果问题仍然存在，在生产环境中添加详细日志：

```typescript
// app/api/auth/callback/route.ts
function getRedirectUrl(request: Request, path: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')

  console.log('[Redirect Debug]', {
    NODE_ENV: process.env.NODE_ENV,
    forwardedHost,
    forwardedProto,
    host,
    VERCEL_URL: process.env.VERCEL_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    path,
  })

  // ... 其余代码
}
```

然后查看 Vercel Dashboard → Deployments → 选择部署 → Functions 标签查看日志。

## 快速修复（紧急情况）

如果上述方法都不行，可以硬编码你的域名（**仅作为临时方案**）：

```typescript
function getRedirectUrl(request: Request, path: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:3000${path}`
  }

  // 硬编码你的生产域名（临时方案）
  return `https://yourdomain.com${path}`
}
```

**记得之后移除硬编码！**

## 联系支持

如果问题持续存在，请检查：
1. Vercel/平台的文档
2. Supabase Community
3. 提供完整的错误日志和配置截图

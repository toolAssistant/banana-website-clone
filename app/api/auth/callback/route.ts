import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('🔍 [callback] Full URL:', request.url)
  console.log('🔍 [callback] Code:', code)
  console.log('🔍 [callback] Headers:', {
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    'host': request.headers.get('host'),
  })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 获取正确的重定向 URL
      const redirectUrl = getRedirectUrl(request, next)
      console.log('🔍 [callback] Redirect URL:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('🔍 [callback] exchangeCodeForSession error:', error)
    }
  }

  // 返回用户到错误页面
  const errorUrl = getRedirectUrl(request, '/auth/auth-code-error')
  console.log('🔍 [callback] Error redirect URL:', errorUrl)
  return NextResponse.redirect(errorUrl)
}

function getRedirectUrl(request: Request, path: string): string {
  // 尝试多种方式获取正确的主机名
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')

  // 开发环境
  // if (process.env.NODE_ENV === 'development') {
  //   return `http://localhost:3000${path}`
  // }

  // 生产环境 - 优先使用 forwarded headers
  if (forwardedHost) {
    const protocol = forwardedProto || 'https'
    return `${protocol}://${forwardedHost}${path}`
  }

  // 备用方案 - 使用 host header
  if (host) {
    return `https://${host}${path}`
  }

  // 最后的备用方案 - 使用环境变量
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  if (baseUrl) {
    const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    return `${url}${path}`
  }

  // 如果所有方法都失败，使用 request URL 的 origin
  const { origin } = new URL(request.url)
  return `${origin}${path}`
}

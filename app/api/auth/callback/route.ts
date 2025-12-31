import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 如果配置了 "next" 参数,则在登录后将用户重定向到该 URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // 在部署时为原始主机
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // 在开发环境中,我们可以直接重定向到本地主机
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // 返回用户到错误页面,并包含错误描述
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

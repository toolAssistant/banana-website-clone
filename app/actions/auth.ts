'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle(origin: string) {
  const supabase = await createClient()

  console.log('🔍 [signInWithGoogle] origin:', origin)
  console.log('🔍 [signInWithGoogle] redirectTo:', `${origin}/api/auth/callback`)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      // 🔑 关键: 告诉 Supabase 跳过默认的 Site URL，使用我们的 redirectTo
      skipBrowserRedirect: false,
    },
  })

  if (error) {
    console.error('Google 登录错误:', error)
    redirect('/error')
  }

  console.log('🔍 [signInWithGoogle] OAuth URL:', data.url)
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

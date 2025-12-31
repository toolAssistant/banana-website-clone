import { SignInForm } from './signin-form'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">欢迎回来</h1>
          <p className="mt-2 text-muted-foreground">
            使用 Google 账号登录 Nano Banana
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}

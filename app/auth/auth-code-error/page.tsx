import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">认证错误</CardTitle>
            <CardDescription>
              登录过程中出现问题,请重试
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              认证代码交换失败。这可能是由于：
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>认证会话已过期</li>
              <li>网络连接问题</li>
              <li>配置错误</li>
            </ul>
            <Button asChild className="w-full">
              <Link href="/auth/signin">返回登录</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

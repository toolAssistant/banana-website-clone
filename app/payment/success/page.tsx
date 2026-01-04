"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

interface PaymentInfo {
  success: boolean
  order?: {
    id: string
    plan: string
    amount: number
    credits: number
    billingCycle: string
  }
  message?: string
  webhookProcessed?: boolean
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Creem会返回checkout_id,我们使用它作为session_id
  const sessionId = searchParams.get("checkout_id") || searchParams.get("session_id")

  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [webhookStatus, setWebhookStatus] = useState<"pending" | "completed">("pending")

  // 验证支付
  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      setPaymentInfo({ success: false, message: "缺少支付会话ID" })
      return
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/verify-payment?session_id=${sessionId}`)
        const data = await res.json()
        setPaymentInfo(data)
      } catch (error) {
        console.error("验证支付失败:", error)
        setPaymentInfo({ success: false, message: "验证支付失败" })
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  // 轮询webhook状态
  useEffect(() => {
    if (!sessionId || !paymentInfo?.success) return

    const checkWebhookStatus = async () => {
      try {
        const res = await fetch(`/api/payment-status?session_id=${sessionId}`)
        const data = await res.json()
        if (data.webhookProcessed) {
          setWebhookStatus("completed")
        }
      } catch (error) {
        console.error("检查webhook状态失败:", error)
      }
    }

    // 立即检查一次
    checkWebhookStatus()

    // 每3秒轮询一次,最多轮询30秒
    const interval = setInterval(checkWebhookStatus, 3000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      // 30秒后如果还没完成,也标记为完成(webhook可能已经处理但数据库未更新)
      setWebhookStatus("completed")
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [sessionId, paymentInfo?.success])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-lg">验证支付信息...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentInfo?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-6" />
              支付验证失败
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{paymentInfo?.message || "无法验证支付状态"}</p>
            <Button onClick={() => router.push("/pricing")} className="w-full">
              返回定价页面
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { order } = paymentInfo

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="size-16 text-green-500 animate-in zoom-in duration-500" />
              {webhookStatus === "pending" && (
                <Loader2 className="size-6 absolute -right-2 -bottom-2 animate-spin text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">支付成功!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">订单号</span>
              <span className="font-mono text-sm">{order?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">方案</span>
              <span className="font-semibold">{order?.plan} Plan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">金额</span>
              <span className="font-semibold">${order?.amount}/{order?.billingCycle === "yearly" ? "年" : "月"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Credits</span>
              <span className="text-2xl font-bold text-primary">{order?.credits}</span>
            </div>
          </div>

          {webhookStatus === "pending" ? (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="size-5 animate-spin text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">正在处理...</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    我们正在为您的账户发放Credits,请稍候
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Credits已到账!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    您现在可以开始使用AI图像编辑功能了
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/#editor")}
              className="w-full"
              disabled={webhookStatus === "pending"}
            >
              开始使用
            </Button>
            <Button
              onClick={() => router.push("/pricing")}
              variant="outline"
              className="w-full"
            >
              查看其他方案
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

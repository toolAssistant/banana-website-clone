"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    credits: "2 Credits/月",
    features: [
      "基础图像生成",
      "快速响应",
      "无限AI模型",
      "无限图像尺寸",
      "批量图像生成",
      "无验证码",
      "无限图像放大"
    ]
  },
  {
    name: "Hobby",
    price: { monthly: 4.9, yearly: 2.45, original: 9.9 },
    credits: "100 Credits/月",
    features: [
      "Free计划所有功能",
      "标准响应时间",
      "邮件支持",
      "优先支持",
      "无验证码"
    ]
  },
  {
    name: "Basic",
    price: { monthly: 6.9, yearly: 3.45, original: 13.9 },
    credits: "400 Credits/月",
    popular: true,
    features: [
      "高级图像生成",
      "无限图像尺寸",
      "快速响应",
      "优先支持",
      "无限图像放大",
      "批量图像生成",
      "无验证码"
    ]
  },
  {
    name: "Pro",
    price: { monthly: 19.9, yearly: 9.95, original: 39.9 },
    credits: "1500 Credits/月",
    features: [
      "Basic计划所有功能",
      "高级图像生成",
      "快速响应",
      "优先支持"
    ]
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const handlePurchase = async (planName: string, price: number) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName, billingCycle })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error("支付失败:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">选择适合你的方案</h1>
          <p className="text-muted-foreground text-lg mb-8">灵活的定价，满足各种需求</p>

          <div className="inline-flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "yearly"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              年付 <span className="text-xs ml-1">(省50%)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm">
                  最受欢迎
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.credits}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-muted-foreground">/月</span>
                  {plan.price.original && (
                    <div className="text-sm text-muted-foreground line-through">
                      原价 ${plan.price.original}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="size-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.name === "Free" ? "outline" : "default"}
                  onClick={() => handlePurchase(plan.name, billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly)}
                >
                  {plan.name === "Free" ? "开始使用" : "立即购买"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

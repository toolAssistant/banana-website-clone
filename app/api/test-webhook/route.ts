import { NextRequest, NextResponse } from "next/server"

// 测试webhook的endpoint,手动触发
export async function POST(req: NextRequest) {
  try {
    // 模拟Creem发送的webhook数据
    const testWebhookData = {
      type: "checkout.completed",
      data: {
        id: "ch_test_123",
        customer: {
          email: "[email protected]" // 改成你的测试邮箱
        },
        amount: 690, // $6.90 in cents
        metadata: {
          plan: "Basic",
          billingCycle: "monthly"
        }
      }
    }

    console.log("发送测试webhook到 /api/webhooks/creem")

    // 调用真实的webhook处理器
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/creem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testWebhookData)
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: "测试webhook已发送",
      webhookResponse: result
    })
  } catch (error) {
    console.error("测试webhook错误:", error)
    return NextResponse.json(
      { success: false, error: "测试失败" },
      { status: 500 }
    )
  }
}

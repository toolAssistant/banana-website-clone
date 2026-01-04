import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CREDITS_MAP: Record<string, number> = {
  Hobby: 100,
  Basic: 400,
  Pro: 1500
}

export async function GET(req: NextRequest) {
  try {
    // 从URL获取所有Creem返回的参数
    const sessionId = req.nextUrl.searchParams.get("session_id")
    const checkoutId = req.nextUrl.searchParams.get("checkout_id")
    const orderId = req.nextUrl.searchParams.get("order_id")
    const productId = req.nextUrl.searchParams.get("product_id")

    const finalId = checkoutId || sessionId

    if (!finalId) {
      return NextResponse.json(
        { success: false, message: "缺少支付会话ID" },
        { status: 400 }
      )
    }

    console.log('@dev 验证支付参数:', {
      checkoutId,
      orderId,
      productId
    })

    const supabase = await createClient()

    // 尝试从数据库查询支付记录(如果webhook已处理)
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("session_id", finalId)
      .single()

    if (payment) {
      // 找到了支付记录,返回详细信息
      console.log('@dev 从数据库获取支付信息:', payment)
      return NextResponse.json({
        success: true,
        order: {
          id: finalId,
          orderId: orderId || payment.id,
          plan: payment.plan,
          amount: payment.amount.toFixed(2),
          credits: payment.credits_granted,
          billingCycle: payment.billing_cycle
        }
      })
    }

    // 如果数据库中还没有记录(webhook未处理),返回默认信息
    // 用户可以看到支付成功提示,等待webhook处理
    console.log('@dev 数据库中未找到支付记录,返回默认信息')

    return NextResponse.json({
      success: true,
      order: {
        id: finalId,
        orderId: orderId || "",
        plan: "Basic",
        amount: "0.00",
        credits: 400,
        billingCycle: "monthly"
      }
    })
  } catch (error) {
    console.error("验证支付错误:", error)
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    )
  }
}

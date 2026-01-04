import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "缺少session_id参数" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 查询payments表,检查webhook是否已处理
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (error) {
      // 如果找不到记录,说明webhook还未处理
      if (error.code === "PGRST116") {
        return NextResponse.json({
          webhookProcessed: false,
          message: "等待处理中"
        })
      }
      throw error
    }

    return NextResponse.json({
      webhookProcessed: payment.status === "completed",
      payment: {
        id: payment.id,
        status: payment.status,
        creditsGranted: payment.credits_granted,
        createdAt: payment.created_at
      }
    })
  } catch (error) {
    console.error("查询支付状态错误:", error)
    return NextResponse.json(
      { error: "服务器错误", webhookProcessed: false },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CREDITS_MAP: Record<string, number> = {
  Hobby: 100,
  Basic: 400,
  Pro: 1500
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json()
    console.log("@dev Webhook收到事件:", JSON.stringify(event, null, 2))

    // TODO: 验证webhook签名(生产环境必须)
    // const signature = req.headers.get("x-creem-signature")
    // if (!verifySignature(signature, event)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    // }

    const supabase = await createClient()

    // 处理不同类型的事件
    switch (event.type) {
      case "checkout.completed":
      case "payment.succeeded": {
        const sessionId = event.data?.id || event.checkout_id
        const customerEmail = event.data?.customer?.email || event.customer?.email
        const plan = event.data?.metadata?.plan || event.metadata?.plan || "Unknown"
        const billingCycle = event.data?.metadata?.billingCycle || event.metadata?.billingCycle || "monthly"
        const amount = event.data?.amount || event.amount || 0
        const credits = CREDITS_MAP[plan] || 0

        console.log("@dev 处理支付成功事件:", {
          sessionId,
          customerEmail,
          plan,
          credits
        })

        // 1. 保存支付记录到数据库
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            session_id: sessionId,
            customer_email: customerEmail,
            plan,
            billing_cycle: billingCycle,
            amount: amount / 100, // Creem通常以分为单位
            credits_granted: credits,
            status: "completed",
            webhook_data: event
          })
          .select()
          .single()

        if (paymentError) {
          console.error("保存支付记录失败:", paymentError)
          // 检查是否是重复事件
          if (paymentError.code === "23505") {
            console.log("重复的webhook事件,跳过处理")
            return NextResponse.json({ received: true, duplicate: true })
          }
          throw paymentError
        }

        console.log("@dev 支付记录已保存:", payment)

        // 2. 给用户发放credits(通过邮箱查找用户)
        if (customerEmail) {
          // 查找用户profile
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("id, email, credits")
            .eq("email", customerEmail)
            .limit(1)

          if (profiles && profiles.length > 0) {
            const profile = profiles[0]
            const newCredits = (profile.credits || 0) + credits

            // 更新用户credits
            const { error: updateError } = await supabase
              .from("user_profiles")
              .update({ credits: newCredits })
              .eq("id", profile.id)

            if (updateError) {
              console.error("更新用户credits失败:", updateError)
            } else {
              console.log(`@dev 用户 ${customerEmail} credits已更新: ${profile.credits} → ${newCredits}`)

              // 更新payment记录的user_id
              await supabase
                .from("payments")
                .update({ user_id: profile.id })
                .eq("id", payment.id)
            }
          } else {
            console.log(`@dev 未找到用户profile: ${customerEmail}`)
          }
        }

        // 3. TODO: 发送确认邮件
        // await sendEmail({
        //   to: customerEmail,
        //   subject: "支付成功",
        //   body: `您已成功购买${plan}计划,${credits}个Credits已到账`
        // })

        break
      }

      case "subscription.renewed": {
        console.log("@dev 订阅续费事件")
        // 处理订阅续费
        break
      }

      case "payment.failed": {
        console.log("@dev 支付失败事件")
        // 处理支付失败
        break
      }

      default:
        console.log(`@dev 未处理的事件类型: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook处理错误:", error)
    return NextResponse.json(
      { error: "Webhook处理失败" },
      { status: 500 }
    )
  }
}

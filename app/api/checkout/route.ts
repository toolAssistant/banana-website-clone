import { NextRequest, NextResponse } from "next/server"

const CREEM_API_KEY = process.env.CREEM_API_KEY
const CREEM_TEST_MODE = process.env.CREEM_TEST_MODE === "true"
const CREEM_API_URL = CREEM_TEST_MODE
  ? "https://test-api.creem.io"
  : "https://api.creem.io"

const PRODUCT_IDS = {
  Hobby: process.env.CREEM_PRODUCT_HOBBY,
  Basic: process.env.CREEM_PRODUCT_BASIC,
  Pro: process.env.CREEM_PRODUCT_PRO
}

export async function POST(req: NextRequest) {
  try {
    const { plan, billingCycle } = await req.json()

    if (plan === "Free") {
      return NextResponse.json({ error: "免费计划无需支付" }, { status: 400 })
    }

    const productId = PRODUCT_IDS[plan as keyof typeof PRODUCT_IDS]
    if (!productId) {
      return NextResponse.json({ error: "无效的计划" }, { status: 400 })
    }

    console.log('@dev productId', productId)
    const response = await fetch(`${CREEM_API_URL}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CREEM_API_KEY!
      },
      body: JSON.stringify({
        product_id: productId,
        metadata: {
          plan,
          billingCycle
        }
      })
    })

    const data = await response.json()
    console.log('@dev response status:', response.status)
    console.log('@dev response data:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "创建支付会话失败" }, { status: response.status })
    }

    // Creem可能返回的字段: url, checkout_url, link等
    const checkoutUrl = data.url || data.checkout_url || data.link
    console.log('@dev checkout url:', checkoutUrl)

    return NextResponse.json({ url: checkoutUrl, raw: data })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

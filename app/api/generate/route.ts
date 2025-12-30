import OpenAI from "openai"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

type OpenRouterContentPart =
  | { type: "text"; text?: string }
  | { type: "image_url"; image_url?: { url?: string } }
  | { type: "image"; image_url?: { url?: string }; image?: { url?: string } }
  | { type: "image"; image?: { url?: string; b64_json?: string } }

type MessageImage = { url?: string; b64_json?: string }

const normalizeImage = (image?: MessageImage) => {
  if (!image) {
    return null
  }
  if (image.url) {
    return image.url
  }
  if(image?.image_url?.url) {
    return image?.image_url?.url
  }
  if (image.b64_json) {
    return `data:image/png;base64,${image.b64_json}`
  }
  return null
}

const extractUrlsFromText = (text: string) => {
  const urls = new Set<string>()
  const dataUrls = text.match(/data:image\/[a-zA-Z.+-]+;base64,[A-Za-z0-9+/=]+/g) ?? []
  dataUrls.forEach((url) => urls.add(url))

  const markdownUrls = text.match(/\((https?:\/\/[^)]+)\)/g) ?? []
  markdownUrls.forEach((match) => {
    const url = match.slice(1, -1)
    if (url) {
      urls.add(url)
    }
  })

  const directUrls = text.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|webp|gif)/g) ?? []
  directUrls.forEach((url) => urls.add(url))

  return Array.from(urls)
}

const extractImages = (data: unknown) => {
  const message = (data as { choices?: { message?: { content?: unknown; images?: MessageImage[] } }[] })?.choices?.[0]
    ?.message
  const content = message?.content

  if (!content || typeof content === "string") {
    const images = (message?.images ?? []).map(normalizeImage).filter((url): url is string => Boolean(url))
    if (images.length) {
      return images
    }
    if (typeof content === "string") {
      return extractUrlsFromText(content)
    }
    return []
  }

  if (Array.isArray(content)) {
    const urls = content
      .map((part: OpenRouterContentPart) => {
        if (part?.type === "image_url") {
          return part.image_url?.url ?? null
        }
        if (part?.type === "image") {
          return part.image_url?.url ?? normalizeImage(part.image) ?? null
        }
        return null
      })
      .filter((url): url is string => Boolean(url))
    const images = (message?.images ?? []).map(normalizeImage).filter((url): url is string => Boolean(url))
    return urls.concat(images)
  }

  return []
}

const debugEnabled = process.env.OPENROUTER_DEBUG === "true"

export async function POST(request: Request) {
  try {
    const { prompt, imageData } = (await request.json()) as { prompt?: string; imageData?: string }

    if (!prompt || !imageData) {
      return NextResponse.json({ error: "Prompt and image are required." }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY." }, { status: 500 })
    }

    const origin = (await headers()).get("origin") ?? "http://localhost:3000"
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": origin,
        "X-Title": "Banana Website Clone",
      },
    })

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
    })

    if (debugEnabled) {
      const message = completion?.choices?.[0]?.message
      console.log("OPENROUTER_DEBUG", {
        id: completion?.id,
        model: completion?.model,
        finish_reason: completion?.choices?.[0]?.finish_reason,
        content: message?.content,
        images: message?.images,
      })
    }

    return NextResponse.json({ images: extractImages(completion) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 }
    )
  }
}

"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Sparkles } from "lucide-react"

export function ImageEditor() {
  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [outputImages, setOutputImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setError(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!image || !prompt.trim()) {
      setError("Please upload an image and enter a prompt before generating.")
      return
    }

    setIsGenerating(true)
    setError(null)
    setOutputImages([])

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageData: image,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate image.")
      }

      const images = Array.isArray(data?.images) ? data.images : []
      setOutputImages(images)

      if (!images.length) {
        setError("No images returned from the API.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section id="editor" className="py-20 md:py-32">
      <div className="container">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Try The AI Editor</h2>
          <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
            Experience the power of natural language image editing. Transform any photo with simple text commands.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <Label htmlFor="image-upload" className="text-base font-semibold">
                  Upload Image
                </Label>
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Add Image
                </Button>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {image ? (
                    <img
                      src={image || "/placeholder.svg"}
                      alt="Uploaded"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 h-64">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="prompt" className="text-base font-semibold mb-4 block">
                Prompt
              </Label>
              <Textarea
                id="prompt"
                placeholder="Describe your desired edits... e.g., 'place the person in a snowy mountain landscape' or 'change background to sunset beach'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 resize-none"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Now"}
            </Button>
          </Card>

          <Card className="p-6">
            <Label className="text-base font-semibold mb-4 block">Output Gallery</Label>
            {outputImages.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {outputImages.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                ))}
              </div>
            ) : (
              <div className="border border-border rounded-lg p-8 bg-muted/30 flex items-center justify-center h-[400px]">
                <div className="text-center space-y-3">
                  <div className="text-6xl">🍌</div>
                  <p className="text-sm text-muted-foreground">
                    {isGenerating ? "Generating your image..." : "Ready for instant generation"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Upload an image and enter your prompt to unleash the power of Nano Banana
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}

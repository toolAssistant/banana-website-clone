import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 to-background py-20 md:py-32">
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <span className="mr-2">🍌</span>
            The AI model that outperforms competitors
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance max-w-4xl">
            Transform Images with <span className="text-primary">Simple Text Prompts</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-pretty">
            Nano Banana's advanced AI model delivers consistent character editing and scene preservation. Experience the
            future of natural language image editing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
              Start Editing Now
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              View Examples
            </Button>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground pt-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>One-shot editing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span>Character consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🖼️</span>
              <span>Multi-image support</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-20 right-10 text-6xl opacity-10 rotate-12 hidden lg:block">🍌</div>
      <div className="absolute bottom-20 left-10 text-8xl opacity-10 -rotate-12 hidden lg:block">🍌</div>
    </section>
  )
}

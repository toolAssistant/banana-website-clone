import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const showcaseItems = [
  {
    title: "Ultra-Fast Mountain Generation",
    description: "Created in 0.8 seconds with optimized neural engine",
    image: "/mountain-landscape.png",
  },
  {
    title: "Instant Garden Creation",
    description: "Complex scene rendered in milliseconds",
    image: "/beautiful-lush-garden-with-flowers.jpg",
  },
  {
    title: "Real-time Beach Synthesis",
    description: "Photorealistic results at lightning speed",
    image: "/tropical-sunset-palms.png",
  },
  {
    title: "Rapid Aurora Generation",
    description: "Advanced effects processed instantly",
    image: "/northern-lights-aurora-borealis-night-sky.jpg",
  },
]

export function Showcase() {
  return (
    <section id="showcase" className="py-20 md:py-32">
      <div className="container">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <span className="mr-2">⚡</span>
            Nano Banana Speed
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Lightning-Fast AI Creations</h2>
          <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
            See what Nano Banana generates in milliseconds
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {showcaseItems.map((item, index) => (
            <Card key={index} className="overflow-hidden group">
              <div className="relative overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                  <span className="mr-1">🍌</span>
                  Nano Banana Speed
                </Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Try Nano Banana Generator
          </Button>
        </div>
      </div>
    </section>
  )
}

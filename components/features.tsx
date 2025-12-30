import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, ImageIcon, Zap, Layers, Sparkles } from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "Natural Language Editing",
    description: "Edit images using simple text prompts. Our AI understands complex instructions like GPT for images.",
  },
  {
    icon: Users,
    title: "Character Consistency",
    description: "Maintain perfect character details across edits. Excels at preserving faces and identities.",
  },
  {
    icon: ImageIcon,
    title: "Scene Preservation",
    description: "Seamlessly blend edits with original backgrounds. Superior scene fusion compared to competitors.",
  },
  {
    icon: Zap,
    title: "One-Shot Editing",
    description: "Perfect results in a single attempt. Nano Banana solves one-shot image editing effortlessly.",
  },
  {
    icon: Layers,
    title: "Multi-Image Context",
    description: "Process multiple images simultaneously with advanced multi-image editing workflows.",
  },
  {
    icon: Sparkles,
    title: "AI UGC Creation",
    description: "Create consistent AI influencers and UGC content. Perfect for social media and marketing.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Why Choose Nano Banana?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
            The most advanced AI image editor. Revolutionize your photo editing with natural language understanding.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

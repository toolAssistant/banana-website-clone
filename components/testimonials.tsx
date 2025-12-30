import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Digital Creator",
    avatar: "SC",
    content:
      "This editor completely changed my workflow. The character consistency is incredible - miles ahead of other tools!",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "UGC Specialist",
    avatar: "MR",
    content:
      "Creating consistent AI influencers has never been easier. It maintains perfect face details across all edits!",
    rating: 5,
  },
  {
    name: "Emily Taylor",
    role: "Professional Editor",
    avatar: "ET",
    content: "One-shot editing is basically solved with this tool. The scene blending is so natural and realistic!",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">What Creators Are Saying</h2>
          <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
            Join thousands of satisfied creators transforming their images with Nano Banana
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12 bg-primary/20">
                    <AvatarFallback className="text-primary font-semibold">{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

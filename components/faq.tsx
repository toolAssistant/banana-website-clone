import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is Nano Banana?",
    answer:
      "It's a revolutionary AI image editing model that transforms photos using natural language prompts. This is currently one of the most powerful image editing models available, with exceptional consistency and superior performance for character editing and scene preservation.",
  },
  {
    question: "How does it work?",
    answer:
      'Simply upload an image and describe your desired edits in natural language. The AI understands complex instructions like "place the person in a snowy mountain" or "change the background to a sunset beach". It processes your text prompt and generates perfectly edited images.',
  },
  {
    question: "What makes Nano Banana different?",
    answer:
      "This model excels in character consistency, scene blending, and one-shot editing. It preserves facial features and seamlessly integrates edits with backgrounds. It also supports multi-image context, making it ideal for creating consistent AI influencers and content.",
  },
  {
    question: "Can I use it for commercial projects?",
    answer:
      "Yes! It's perfect for creating AI UGC content, social media campaigns, and marketing materials. Many users leverage it for creating consistent AI influencers and product photography. The high-quality outputs are suitable for professional use.",
  },
  {
    question: "What types of edits can it handle?",
    answer:
      "The editor handles complex edits including face completion, background changes, object placement, style transfers, and character modifications. It excels at understanding contextual instructions while maintaining photorealistic quality.",
  },
  {
    question: "How fast is the image generation?",
    answer:
      "Nano Banana delivers ultra-fast results, typically generating complex edits in under a second. Our optimized neural engine ensures you get professional-quality results at lightning speed.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container max-w-3xl">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground text-pretty">Everything you need to know about Nano Banana</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="font-semibold">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍌</span>
          <span className="text-xl font-bold">Nano Banana</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#editor" className="text-sm font-medium hover:text-primary transition-colors">
            Editor
          </Link>
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#showcase" className="text-sm font-medium hover:text-primary transition-colors">
            Showcase
          </Link>
          <Link href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
            FAQ
          </Link>
        </nav>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Start Editing</Button>
      </div>
    </header>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-accent-foreground">T</span>
          </div>
          <span className="text-lg font-semibold text-foreground">TemplateHub</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="#templates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Templates
          </Link>
          <Link href="#categorias" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Categorias
          </Link>
          <Link href="#precos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Preços
          </Link>
          <Link href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" size="sm">
            Entrar
          </Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Começar Agora
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-4 p-4">
            <Link href="#templates" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Templates
            </Link>
            <Link href="#categorias" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Categorias
            </Link>
            <Link href="#precos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Preços
            </Link>
            <Link href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="ghost" size="sm" className="justify-start">
                Entrar
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Começar Agora
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

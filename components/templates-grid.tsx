"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, ShoppingCart, Star } from "lucide-react"

const categories = [
  { id: "all", label: "Todos" },
  { id: "nextjs", label: "Next.js" },
  { id: "notion", label: "Notion" },
  { id: "figma", label: "Figma" },
  { id: "planilhas", label: "Planilhas" },
]

const templates = [
  {
    id: 1,
    title: "Dashboard SaaS com IA",
    description: "Dashboard administrativo moderno com integração de IA e analytics em tempo real.",
    price: 297,
    originalPrice: 497,
    category: "nextjs",
    rating: 4.9,
    reviews: 124,
    badge: "Mais Vendido",
    image: "/templates/dashboard-saas.jpg",
  },
  {
    id: 2,
    title: "Landing Page SaaS",
    description: "Template de landing page otimizada para conversão com animações suaves.",
    price: 147,
    originalPrice: 247,
    category: "nextjs",
    rating: 4.8,
    reviews: 89,
    badge: "Popular",
    image: "/templates/landing-saas.jpg",
  },
  {
    id: 3,
    title: "Planejador Notion Pro",
    description: "Sistema completo de planejamento pessoal e profissional para Notion.",
    price: 97,
    originalPrice: 147,
    category: "notion",
    rating: 4.9,
    reviews: 256,
    badge: "Novo",
    image: "/templates/notion-planner.jpg",
  },
  {
    id: 4,
    title: "UI Kit Completo",
    description: "Kit de interface com mais de 200 componentes para Figma.",
    price: 197,
    originalPrice: 297,
    category: "figma",
    rating: 4.7,
    reviews: 67,
    image: "/templates/ui-kit.jpg",
  },
  {
    id: 5,
    title: "Site para Restaurantes",
    description: "Template completo para restaurantes com cardápio digital e reservas.",
    price: 247,
    originalPrice: 397,
    category: "nextjs",
    rating: 4.8,
    reviews: 45,
    image: "/templates/restaurant.jpg",
  },
  {
    id: 6,
    title: "Controle Financeiro",
    description: "Planilha completa para gestão financeira pessoal e empresarial.",
    price: 67,
    originalPrice: 97,
    category: "planilhas",
    rating: 4.9,
    reviews: 312,
    badge: "Bestseller",
    image: "/templates/finance.jpg",
  },
]

export function TemplatesGrid() {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredTemplates = templates.filter(
    (template) => activeCategory === "all" || template.category === activeCategory
  )

  return (
    <section id="templates" className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Encontre o Template Perfeito
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Templates prontos para usar em seus projetos. Alta qualidade e suporte incluído.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className={activeCategory === category.id ? "bg-accent text-accent-foreground" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group overflow-hidden border-border bg-card transition-all hover:border-accent/50">
              <div className="relative aspect-video overflow-hidden bg-secondary">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-bold text-muted-foreground/20">Preview</div>
                </div>
                {template.badge && (
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                    {template.badge}
                  </Badge>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="secondary">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Demo
                  </Button>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span>{template.rating}</span>
                  <span className="text-muted-foreground/50">({template.reviews} reviews)</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{template.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-border p-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">R${template.price}</span>
                  <span className="text-sm text-muted-foreground line-through">R${template.originalPrice}</span>
                </div>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Comprar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" size="lg">
            Ver Todos os Templates
          </Button>
        </div>
      </div>
    </section>
  )
}

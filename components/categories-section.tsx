import { Card, CardContent } from "@/components/ui/card"
import { Code2, FileSpreadsheet, Layers, PenTool } from "lucide-react"

const categories = [
  {
    icon: Code2,
    title: "Next.js & React",
    description: "Dashboards, landing pages, e-commerce e aplicações completas.",
    count: 25,
    price: "R$ 100-500",
  },
  {
    icon: Layers,
    title: "Notion Templates",
    description: "Planejadores, gestão de projetos e sistemas organizacionais.",
    count: 18,
    price: "R$ 30-200",
  },
  {
    icon: PenTool,
    title: "Figma & Design",
    description: "UI Kits, wireframes e design systems completos.",
    count: 12,
    price: "R$ 50-300",
  },
  {
    icon: FileSpreadsheet,
    title: "Planilhas",
    description: "Controle financeiro, gestão de estoque e CRM.",
    count: 15,
    price: "R$ 20-150",
  },
]

export function CategoriesSection() {
  return (
    <section id="categorias" className="border-y border-border bg-secondary/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Categorias de Templates
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Escolha a categoria que melhor atende às suas necessidades.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.title}
              className="group cursor-pointer border-border bg-card transition-all hover:border-accent/50 hover:bg-card/80"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{category.count} templates</span>
                  <span className="font-medium text-accent">{category.price}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">Mais de 500 templates vendidos</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-balance">
            Templates Premium para{" "}
            <span className="text-accent">Acelerar</span> seus Projetos
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            Templates de alta qualidade para Next.js, Notion, Figma e planilhas. 
            Economize semanas de trabalho com designs profissionais prontos para usar.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Ver Templates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Ver Demonstração
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "500+", label: "Templates Vendidos" },
              { value: "50+", label: "Templates Disponíveis" },
              { value: "4.9", label: "Avaliação Média" },
              { value: "24h", label: "Suporte Rápido" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

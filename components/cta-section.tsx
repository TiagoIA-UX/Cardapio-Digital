import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="border-t border-border bg-secondary/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 sm:p-12">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
          </div>
          
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Pronto para acelerar seus projetos?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Junte-se a mais de 500 desenvolvedores e empreendedores que já economizaram semanas de trabalho com nossos templates.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Ver Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Obter Bundle Pro
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

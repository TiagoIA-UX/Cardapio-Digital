import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Individual",
    description: "Perfeito para projetos únicos",
    price: "Variável",
    priceDescription: "por template",
    features: [
      "Acesso ao template escolhido",
      "Código fonte completo",
      "Documentação detalhada",
      "Suporte por 30 dias",
      "Atualizações gratuitas",
    ],
    cta: "Escolher Template",
    popular: false,
  },
  {
    name: "Bundle Pro",
    description: "Todos os templates em um pacote",
    price: "R$ 997",
    priceDescription: "pagamento único",
    features: [
      "Acesso a TODOS os templates",
      "Código fonte completo",
      "Documentação detalhada",
      "Suporte prioritário por 1 ano",
      "Atualizações vitalícias",
      "Novos templates inclusos",
      "Grupo exclusivo no Discord",
    ],
    cta: "Obter Bundle Pro",
    popular: true,
  },
  {
    name: "Licença Comercial",
    description: "Para agências e times",
    price: "R$ 1.997",
    priceDescription: "pagamento único",
    features: [
      "Tudo do Bundle Pro",
      "Uso ilimitado em projetos de clientes",
      "Licença para equipe de até 10 pessoas",
      "Suporte dedicado",
      "Consultoria de 1 hora",
      "Prioridade em novos templates",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="precos" className="border-y border-border bg-secondary/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Planos e Preços
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Escolha a opção que melhor se adapta às suas necessidades.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border bg-card ${plan.popular ? "border-accent ring-1 ring-accent" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="p-6">
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{plan.priceDescription}</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button
                  className={`w-full ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

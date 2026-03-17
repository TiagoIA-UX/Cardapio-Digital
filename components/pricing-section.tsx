import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { getTemplateCatalog } from '@/lib/templates-config'
import { getTemplatePricing } from '@/lib/pricing'

export function PricingSection() {
  const templates = getTemplateCatalog()
  const selfPix = templates.map((template) => getTemplatePricing(template.slug).selfService.pix)
  const selfCard = templates.map((template) => getTemplatePricing(template.slug).selfService.card)
  const fpvcPix = templates.map((template) => getTemplatePricing(template.slug).feitoPraVoce.pix)
  const fpvcCard = templates.map((template) => getTemplatePricing(template.slug).feitoPraVoce.card)

  const plans = [
    {
      name: 'Faça Você Mesmo',
      description: 'Para quem quer editar o cardápio no painel com autonomia total.',
      price: `R$ ${Math.min(...selfPix)}`,
      priceDescription: 'no PIX',
      priceFootnote: `ou até R$ ${Math.max(...selfCard)} no cartão`,
      features: [
        '1 restaurante ativo',
        'Editor visual do cardápio',
        'QR Code e link público',
        'Pedidos via WhatsApp',
        'Hospedagem incluída',
      ],
      cta: 'Escolher template',
      popular: false,
    },
    {
      name: 'Feito Pra Você',
      description: 'Para quem quer comprar agora e deixar a implantação com a equipe.',
      price: `R$ ${Math.min(...fpvcPix)}`,
      priceDescription: 'no PIX',
      priceFootnote: `ou até R$ ${Math.max(...fpvcCard)} no cartão`,
      features: [
        'Tudo do Faça Você Mesmo',
        'Montagem pela nossa equipe',
        'Envio de fotos e preços depois da compra',
        'Acompanhamento na ativação',
        'Suporte prioritário',
      ],
      cta: 'Ver opções de compra',
      popular: true,
    },
  ]

  return (
    <section id="precos" className="border-border bg-secondary/30 border-y py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Ofertas e preços
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            No fluxo público atual, a contratação é feita por template com pagamento único.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border bg-card relative ${plan.popular ? 'border-accent ring-accent ring-1' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="p-6">
                <h3 className="text-foreground text-xl font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-foreground text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {plan.priceDescription}
                  </span>
                  <p className="text-muted-foreground mt-1 text-xs">{plan.priceFootnote}</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="text-accent mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href="/templates" className="w-full">
                  <Button
                    className={`w-full ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

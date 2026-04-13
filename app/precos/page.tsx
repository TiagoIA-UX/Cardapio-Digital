import Link from 'next/link'
import { ArrowRight, Calculator, Check, Shield, Store, TrendingUp } from 'lucide-react'
import { TEMPLATE_PRICING } from '@/lib/domains/marketing/pricing'
import {
  getTemplatePlans,
  getTemplatePlanCheckoutHref,
} from '@/lib/domains/marketing/template-plans'
import {
  TEMPLATE_FAMILIES,
  TEMPLATE_FAMILY_ORDER,
  TEMPLATE_PUBLIC_ORDER,
  getPublicTemplateMeta,
} from '@/lib/domains/marketing/template-public-meta'

const FAMILY_SECTIONS = TEMPLATE_FAMILY_ORDER.map((familyId) => ({
  ...TEMPLATE_FAMILIES[familyId],
  slugs: TEMPLATE_PUBLIC_ORDER.filter((slug) => getPublicTemplateMeta(slug).family === familyId),
})).filter((section) => section.slugs.length > 0)

export default function PrecosPage() {
  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="text-primary h-6 w-6" />
            <span className="text-foreground text-xl font-bold">Zairyx</span>
          </Link>
          <Link
            href="/templates"
            className="text-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Ver templates
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Calculator className="h-4 w-4" />
            Escolha pelo tamanho real do catálogo
          </div>
          <h1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Preços mais claros para cada operação
          </h1>
          <p className="text-foreground/90 mx-auto max-w-2xl text-lg">
            São 16 nichos com 3 faixas de catálogo. Você escolhe pela quantidade de itens que
            realmente pretende vender, sem adivinhar plano por nome.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            <Check className="h-4 w-4" />
            Zero taxa por pedido ou venda direta no seu canal
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-left">
              <p className="text-sm font-semibold text-zinc-500 uppercase">16 nichos</p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">Vitrine organizada</p>
              <p className="mt-2 text-sm text-zinc-600">
                Nomes públicos mais claros para reduzir confusão entre modelos parecidos.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-left">
              <p className="text-sm font-semibold text-zinc-500 uppercase">3 faixas</p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">Essencial, Operação, Escala</p>
              <p className="mt-2 text-sm text-zinc-600">
                A faixa define o tamanho do catálogo. O modo de implantação você decide no checkout.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-left">
              <p className="text-sm font-semibold text-zinc-500 uppercase">Compra direta</p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">0% por pedido</p>
              <p className="mt-2 text-sm text-zinc-600">
                Checkout próprio, pedidos no seu canal e mensalidade fixa conforme capacidade.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {FAMILY_SECTIONS.map((section) => (
            <section
              key={section.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-6">
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
                    {section.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-zinc-950 md:text-3xl">
                    Mesmo padrão de compra
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-zinc-600">{section.description}</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {section.slugs.map((slug) => {
                  const meta = getPublicTemplateMeta(slug)
                  const pricing = TEMPLATE_PRICING[slug]
                  const plans = getTemplatePlans(slug)

                  return (
                    <article
                      key={slug}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                    >
                      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-zinc-950">{meta.publicName}</h3>
                          <p className="mt-1 text-sm text-zinc-600">{meta.summary}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-right text-xs text-zinc-600">
                          <p className="font-semibold text-zinc-900">{pricing.nomeCanal}</p>
                          <p>Mix típico: {pricing.mediaProdutos} produtos</p>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                          {meta.categoryLabel}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                          {meta.productProfile}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className={`rounded-2xl border p-4 ${plan.popular ? 'border-orange-300 bg-orange-50' : 'border-zinc-200 bg-white'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-zinc-950">{plan.displayName}</h4>
                                <p className="mt-1 text-xs text-zinc-600">{plan.description}</p>
                              </div>
                              {plan.popular ? (
                                <span className="rounded-full bg-orange-500 px-2 py-1 text-[10px] font-bold text-white uppercase">
                                  Mais pedido
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-4 text-2xl font-bold text-zinc-950">
                              {plan.maxProducts}
                            </p>
                            <p className="text-xs text-zinc-500">produtos no catálogo</p>

                            <p className="mt-3 text-sm font-medium text-zinc-800">
                              Mensalidade correspondente: R$ {plan.priceMonthly}/mês
                            </p>
                            <p className="text-xs text-zinc-500">
                              Plano anual: R$ {plan.priceAnnual}
                            </p>

                            <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
                              <p>{meta.productProfile}</p>
                              <p className="mt-1">Faixa correspondente: {plan.capacitySlug}</p>
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                              <Link
                                href={getTemplatePlanCheckoutHref(slug, plan.name, 'self-service')}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                              >
                                Você configura
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                              <Link
                                href={getTemplatePlanCheckoutHref(
                                  slug,
                                  plan.name,
                                  'feito-pra-voce'
                                )}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                              >
                                Equipe configura
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="border-border bg-card mt-16 mb-16 rounded-2xl border p-6 md:p-8">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-xl font-bold">
            <TrendingUp className="text-primary h-5 w-5" />
            Como ler a nova régua comercial
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border-border bg-muted/20 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">1. Escolha a faixa do catálogo</h3>
              <p className="text-foreground/90 text-sm">
                Essencial atende entrada enxuta. Operação cobre o dia a dia equilibrado. Escala é
                para mix mais largo, sazonalidade e expansão.
              </p>
            </div>
            <div className="border-border bg-primary/5 rounded-xl border p-4">
              <h3 className="text-foreground mb-2 font-semibold">
                2. No checkout, escolha a implantação
              </h3>
              <p className="text-foreground/90 text-sm">
                Você pode configurar sozinho ou mandar as fotos e dados para a equipe montar tudo. A
                capacidade do catálogo continua sendo preservada em ambos os modos.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-foreground/90 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Faixa clara, checkout sem surpresa e canal próprio para vender direto.
          </div>
          <Link
            href="/templates"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-4 font-semibold transition-colors"
          >
            Escolher template
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}

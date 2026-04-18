import Link from 'next/link'
import { ArrowRight, Check, Shield, Store, Zap } from 'lucide-react'
import { PUBLIC_SUBSCRIPTION_PRICES, PLAN_LIMITS } from '@/lib/domains/marketing/pricing'

const PLANS = [
  {
    slug: 'semente' as const,
    name: 'Começo',
    audience: 'Quem está começando',
    highlight: false,
  },
  {
    slug: 'basico' as const,
    name: 'Operação',
    audience: 'Dia a dia rodando',
    highlight: true,
  },
  {
    slug: 'pro' as const,
    name: 'Escala',
    audience: 'Mix amplo e crescimento',
    highlight: false,
  },
  {
    slug: 'premium' as const,
    name: 'Rede',
    audience: 'Catálogo extenso ou múltiplas unidades',
    highlight: false,
  },
]

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-zinc-950">Zairyx</span>
          </Link>
          <Link
            href="/templates"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Ver templates
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-950 md:text-5xl">
            Planos simples, sem taxa por pedido
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600">
            Você paga apenas pela capacidade do seu catálogo. O template você escolhe separado.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" />
            0% de comissão por pedido — venda direto no seu canal
          </div>
        </div>

        {/* Cards */}
        <div className="mb-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const prices = PUBLIC_SUBSCRIPTION_PRICES[plan.slug]
            const limits = PLAN_LIMITS[plan.slug]

            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-orange-300 bg-orange-50 shadow-md'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase text-white">
                    Mais escolhido
                  </span>
                )}

                <h3 className="text-lg font-bold text-zinc-950">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{plan.audience}</p>

                <div className="mt-6">
                  <span className="text-3xl font-bold text-zinc-950">
                    R$ {formatBRL(prices.monthly)}
                  </span>
                  <span className="text-sm text-zinc-500">/mês</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  ou R$ {formatBRL(prices.annual)}/ano
                </p>

                <div className="mt-6 flex-1">
                  <div className="rounded-xl bg-zinc-100 p-3 text-center">
                    <p className="text-2xl font-bold text-zinc-950">{limits.maxProducts}</p>
                    <p className="text-xs text-zinc-600">produtos no catálogo</p>
                  </div>
                  {'maxOrdersPerMonth' in limits && (
                    <p className="mt-2 text-center text-xs text-zinc-500">
                      até {limits.maxOrdersPerMonth} pedidos/mês
                    </p>
                  )}
                </div>

                <Link
                  href="/templates"
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-zinc-950 text-white hover:bg-zinc-800'
                  }`}
                >
                  Escolher template
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Como funciona */}
        <section className="mb-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 md:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-zinc-950">
            <Zap className="h-5 w-5 text-orange-600" />
            Como funciona
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-orange-600">1</p>
              <h3 className="mt-1 font-semibold text-zinc-950">Escolha o template</h3>
              <p className="mt-1 text-sm text-zinc-600">
                O template define o visual e o nicho do seu cardápio (pizzaria, açaí, sushi, etc.).
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-600">2</p>
              <h3 className="mt-1 font-semibold text-zinc-950">O plano define a capacidade</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Quantos produtos você pode cadastrar no catálogo. Sem limites artificiais de pedidos nos planos maiores.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-600">3</p>
              <h3 className="mt-1 font-semibold text-zinc-950">Implantação no checkout</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Configure sozinho ou peça para a equipe montar tudo. Você decide na hora da compra.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-zinc-600">
            <Shield className="h-5 w-5 text-green-500" />
            Sem surpresas no checkout. Mensalidade fixa, canal próprio.
          </div>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-orange-700"
          >
            Ver templates disponíveis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}

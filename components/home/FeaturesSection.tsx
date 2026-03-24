import { LayoutTemplate, Rocket, Shield, TabletSmartphone } from 'lucide-react'

const PLATFORM_FEATURES = [
  {
    icon: LayoutTemplate,
    title: '15 Modelos Prontos para Cada Tipo de Operação',
    description:
      'Pizzaria, hamburgueria, açaí, sushi, bar, doceria — cada template foi desenhado para o perfil do negócio, com visual que facilita a escolha do cliente e aumenta a conversão.',
  },
  {
    icon: Shield,
    title: 'Zero Comissão por Pedido — o Lucro É Todo Seu',
    description:
      'Diferente de plataformas que cobram de 12% a 27% por pedido, aqui você paga apenas a assinatura fixa. Tudo que o cliente paga vai direto pra você.',
  },
  {
    icon: TabletSmartphone,
    title: 'Painel Simples no Celular e no Computador',
    description:
      'Se você sabe usar WhatsApp, consegue usar o painel. Atualize preços, fotos e promoções de qualquer lugar, sem depender de ninguém.',
  },
  {
    icon: Rocket,
    title: 'Preparado para Alta Temporada e Picos de Demanda',
    description:
      'No litoral e em datas sazonais o volume de pedidos dispara. Com o cardápio digital organizado, sua equipe atende mais rápido e sem perder pedido.',
  },
] as const

export function FeaturesSection() {
  return (
    <section id="estrutura" className="bg-zinc-950 px-4 py-20 text-zinc-50 md:py-24">
      <div className="container-premium">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-orange-300 uppercase">
              Proposta de Valor
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Venda Online com Painel de Edição e Mais Controle.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-zinc-200">
            O Cardápio Digital da Zairyx foi desenvolvido para negócios reais de alimentação que
            precisam vender online com clareza, confiança e agilidade no dia a dia.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_FEATURES.map((feature) => {
            const Icon = feature.icon

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-200">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

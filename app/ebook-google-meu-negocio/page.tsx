import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Gift, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { EbookGmbCheckoutCard } from '@/components/marketing/ebook-gmb-checkout-card'

export const metadata: Metadata = {
  title: 'Litoral Conecta | E-book Google Meu Negócio',
  description:
    'Compra avulsa do guia profissional de Google Meu Negócio da Zairyx. Onde sua marca deixa de depender e começa a expandir.',
}

export default function EbookGoogleMeuNegocioPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_30%),linear-gradient(to_bottom,#ffffff,#f8fafc)] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="text-right">
            <p className="text-xs font-bold tracking-[0.18em] text-zinc-500 uppercase">
              Grupo Zairyx AI
            </p>
            <p className="text-sm font-semibold text-zinc-900">Litoral Conecta Canais Digitais</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.1fr)_420px] md:py-16">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">
            <Sparkles className="h-4 w-4" />
            Onde sua marca deixa de depender e começa a expandir.
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">
            Compre o guia de Google Meu Negócio sem contratar o plano inteiro.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-600">
            Se você quer aprender a configurar, posicionar e manter o Google Meu Negócio do jeito
            certo, pode comprar o material avulso e aplicar no seu ritmo. Sem promessa confusa, sem
            pacote escondido.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold tracking-[0.16em] text-zinc-500 uppercase">
                O que está incluso
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  92 páginas de passo a passo prático
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Dados oficiais do Google e pesquisa de mercado
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Modelos de respostas, checklist e melhores práticas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Orientação sobre integração com cardápio digital quando você já tiver um canal
                  ativo
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-bold tracking-[0.16em] text-amber-700 uppercase">
                Importante
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-amber-900">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />O guia não
                  inclui criação do canal digital Zairyx.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />O link do
                  cardápio só pode ser configurado se você já tiver um canal ativo.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  Setup feito pela equipe é uma contratação separada.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-4xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-zinc-700 uppercase">
                <MapPin className="h-3.5 w-3.5" /> Litoral Conecta
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-emerald-700 uppercase">
                <Gift className="h-3.5 w-3.5" /> Bônus para assinantes Zairyx
              </span>
            </div>
            <p className="mt-4 text-base leading-7 text-zinc-700">
              Se depois você contratar o canal digital Zairyx, esse mesmo conteúdo continua valendo
              como apoio operacional. Ou seja: o guia funciona tanto como compra avulsa quanto como
              material de aceleração para quem entra no ecossistema.
            </p>
          </div>
        </section>

        <aside>
          <EbookGmbCheckoutCard />
        </aside>
      </main>
    </div>
  )
}

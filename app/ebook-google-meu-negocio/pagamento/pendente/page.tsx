import Link from 'next/link'
import { Clock3, Home } from 'lucide-react'

export default function EbookPagamentoPendentePage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-4xl border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock3 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950">
          Pagamento pendente
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          Seu checkout foi criado e está aguardando confirmação. Assim que o Mercado Pago aprovar,
          volte para esta página pelo link de retorno do pagamento.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-4 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50"
          >
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}

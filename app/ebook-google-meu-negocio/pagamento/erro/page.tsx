import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function EbookPagamentoErroPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-4xl border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950">
          Pagamento não concluído
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          O checkout foi interrompido ou recusado. Você pode tentar novamente sem perder a oferta
          avulsa do guia.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/ebook-google-meu-negocio"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Tentar novamente
          </Link>
        </div>
      </div>
    </div>
  )
}

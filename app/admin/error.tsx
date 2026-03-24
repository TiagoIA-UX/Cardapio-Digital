'use client'

import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">Erro no painel administrativo</h2>
      <p className="text-muted-foreground max-w-sm text-sm">{error.message}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="border-border rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-zinc-100"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

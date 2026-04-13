'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, RefreshCcw, ShieldAlert } from 'lucide-react'

type ReadinessItem = {
  id: string
  label: string
  ok: boolean
  detail: string
}

type ReadinessCategory = {
  key: string
  title: string
  items: ReadinessItem[]
}

type ReadinessResponse = {
  generatedAt: string
  summary: {
    total: number
    healthy: number
    attention: number
  }
  categories: ReadinessCategory[]
}

export default function ScriptsPage() {
  const [loading, setLoading] = useState(true)
  const [notifying, setNotifying] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<ReadinessResponse | null>(null)
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/scripts/readiness', { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error || 'Nao foi possivel carregar o diagnostico')
        setData(null)
        return
      }

      setData(payload as ReadinessResponse)
    } catch (err) {
      setError((err as Error).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/painel"
            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
          <h1 className="text-foreground text-2xl font-bold">Central de Scripts Essenciais</h1>
          <p className="text-muted-foreground text-sm">
            Diagnostico de automacoes, seguranca, pagamentos e marketing do seu SaaS.
          </p>
        </div>

        <button
          onClick={() => {
            void loadData()
          }}
          className="border-border bg-card hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </button>

        <button
          onClick={async () => {
            setNotifying(true)
            setNotice('')

            try {
              const response = await fetch('/api/admin/scripts/readiness/notify', {
                method: 'POST',
              })
              const payload = await response.json()

              if (!response.ok) {
                setNotice(payload?.error || 'Falha ao notificar ForgeOps AI')
                return
              }

              if (payload?.sentToForgeOps) {
                setNotice('Notificacao enviada ao ForgeOps AI com sucesso.')
              } else {
                setNotice('Sem pendencias criticas. Notificacao informativa registrada.')
              }
            } catch (err) {
              setNotice((err as Error).message)
            } finally {
              setNotifying(false)
            }
          }}
          disabled={notifying}
          className="border-border bg-card hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldAlert className="h-4 w-4" />
          {notifying ? 'Notificando...' : 'Notificar ForgeOps AI'}
        </button>
      </div>

      {loading && <p className="text-muted-foreground">Carregando diagnostico...</p>}

      {!loading && error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-700">
          {notice}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="bg-card border-border rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">Total de verificacoes</p>
              <p className="text-foreground mt-1 text-2xl font-bold">{data.summary.total}</p>
            </div>
            <div className="rounded-xl border border-green-300 bg-green-50 p-4">
              <p className="text-xs text-green-700">Saudaveis</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{data.summary.healthy}</p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Precisam de atencao</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{data.summary.attention}</p>
            </div>
          </div>

          <div className="space-y-4">
            {data.categories.map((category) => (
              <section key={category.key} className="bg-card border-border rounded-xl border p-4">
                <h2 className="text-foreground mb-3 text-base font-semibold">{category.title}</h2>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-foreground text-sm font-medium">{item.label}</p>
                        <p className="text-muted-foreground text-xs">{item.detail}</p>
                      </div>

                      {item.ok ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Ajustar
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            Atualizado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}
          </p>
        </>
      )}
    </div>
  )
}

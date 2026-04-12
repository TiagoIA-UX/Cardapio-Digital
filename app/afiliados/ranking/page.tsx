'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type RankingRow = {
  affiliate_code?: string | null
  display_name?: string | null
  city?: string | null
  total_referrals?: number | null
  approved_referrals?: number | null
  conversion_rate?: number | null
}

export default function AfiliadosRankingPage() {
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)
  const [ranking, setRanking] = useState<RankingRow[]>([])

  useEffect(() => {
    let mounted = true

    const loadRanking = async () => {
      try {
        const res = await fetch('/api/afiliados/ranking', { cache: 'no-store' })
        const body = await res.json()
        if (!mounted) return

        setRanking(Array.isArray(body?.ranking) ? body.ranking : [])
        setWarning(typeof body?.warning === 'string' ? body.warning : null)
      } catch {
        if (!mounted) return
        setRanking([])
        setWarning('Não foi possível carregar o ranking agora.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadRanking()
    return () => {
      mounted = false
    }
  }, [])

  const sorted = useMemo(
    () =>
      [...ranking].sort(
        (a, b) =>
          Number(b.approved_referrals ?? b.total_referrals ?? 0) -
          Number(a.approved_referrals ?? a.total_referrals ?? 0)
      ),
    [ranking]
  )

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">Ranking público de afiliados</h1>
          <Link
            href="/afiliados"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-900"
          >
            Voltar
          </Link>
        </div>

        {warning ? (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {warning}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-300">
            Carregando ranking...
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-300">
            Ainda não há dados públicos para exibir.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Afiliado</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Aprovadas</th>
                  <th className="px-4 py-3">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => {
                  const taxa = Number(row.conversion_rate ?? 0)
                  return (
                    <tr
                      key={`${row.affiliate_code ?? row.display_name ?? 'afiliado'}-${idx}`}
                      className="border-t border-zinc-800"
                    >
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3">
                        {row.display_name ?? row.affiliate_code ?? 'Afiliado'}
                      </td>
                      <td className="px-4 py-3">{row.city ?? '-'}</td>
                      <td className="px-4 py-3">
                        {Number(row.approved_referrals ?? row.total_referrals ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        {Number.isFinite(taxa) ? `${taxa.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

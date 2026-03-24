import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AnalyticsResumo, ProdutoMaisVendido, PedidoPorHora } from '@/types/analytics'

// ── Helpers de formatação ─────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ── Componentes de Card ───────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  )
}

// ── Barra de distribuição por hora ────────────────────────────────────────────

function HoraBar({ hora, total, max }: { hora: number; total: number; max: number }) {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0
  const label = `${hora.toString().padStart(2, '0')}h`
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-right text-xs text-zinc-500">{label}</span>
      <div className="flex-1 rounded-full bg-zinc-100">
        <div
          className="h-3 rounded-full bg-zinc-800 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs text-zinc-500">{total}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Buscar restaurante do operador
  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id, nome')
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <p className="text-zinc-500">Restaurante não encontrado.</p>
      </div>
    )
  }

  // Buscar analytics agregados
  const { data: analytics } = await supabase
    .from('vw_analytics_operador')
    .select('*')
    .eq('restaurant_id', restaurante.id)
    .single()

  const resumo = analytics as AnalyticsResumo | null

  // Buscar produtos mais vendidos
  const { data: produtosRaw } = await supabase.rpc('fn_produtos_mais_vendidos', {
    p_restaurante_id: restaurante.id,
    p_limite: 10,
  })
  const produtos = (produtosRaw as ProdutoMaisVendido[]) ?? []

  // Buscar distribuição por hora
  const { data: horasRaw } = await supabase.rpc('fn_pedidos_por_hora', {
    p_restaurante_id: restaurante.id,
  })
  const horas = (horasRaw as PedidoPorHora[]) ?? []
  const maxHora = horas.reduce((acc, h) => Math.max(acc, h.total), 0)

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">{restaurante.nome}</p>
      </div>

      {/* Cards de resumo */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Resumo
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Pedidos hoje"
            value={String(resumo?.pedidos_hoje ?? 0)}
          />
          <StatCard
            label="Pedidos (7 dias)"
            value={String(resumo?.pedidos_semana ?? 0)}
          />
          <StatCard
            label="Pedidos (30 dias)"
            value={String(resumo?.pedidos_mes ?? 0)}
          />
          <StatCard
            label="Total de pedidos"
            value={String(resumo?.total_pedidos ?? 0)}
          />
        </div>
      </section>

      {/* Cards financeiros */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Receita
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Receita (30 dias)"
            value={formatCurrency(resumo?.receita_mes ?? 0)}
          />
          <StatCard
            label="Receita total"
            value={formatCurrency(resumo?.receita_total ?? 0)}
          />
          <StatCard
            label="Ticket médio"
            value={formatCurrency(resumo?.ticket_medio ?? 0)}
          />
        </div>
      </section>

      {/* Produtos mais vendidos */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Produtos mais vendidos (top 10)
        </h2>
        {produtos.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhum dado disponível.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">#</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Produto</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Qtd</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Receita</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p, i) => (
                  <tr key={p.produto_nome} className="border-b border-zinc-50 last:border-0">
                    <td className="px-4 py-3 text-zinc-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{p.produto_nome}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{p.quantidade}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">
                      {formatCurrency(p.receita)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Distribuição por hora */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Distribuição por hora (últimos 30 dias)
        </h2>
        {horas.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhum dado disponível.</p>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              {horas.map((h) => (
                <HoraBar key={h.hora} hora={h.hora} total={h.total} max={maxHora} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

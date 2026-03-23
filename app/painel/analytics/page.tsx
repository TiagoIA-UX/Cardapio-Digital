import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  BarChart2,
  Clock,
  Package,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface AnalyticsRow {
  pedidos_hoje: number
  pedidos_semana: number
  pedidos_mes: number
  receita_hoje: number
  receita_semana: number
  receita_mes: number
  ticket_medio_mes: number
}

interface TopProduto {
  produto_id: string
  nome: string
  quantidade: number
  receita: number
}

interface HorarioPico {
  hora: number
  pedidos: number
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, nome')
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    redirect('/painel/criar-restaurante')
  }

  // Buscar métricas da view
  const { data: analyticsRaw } = await supabase
    .from('vw_analytics_operador')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .single()

  const analytics: AnalyticsRow = analyticsRaw ?? {
    pedidos_hoje: 0,
    pedidos_semana: 0,
    pedidos_mes: 0,
    receita_hoje: 0,
    receita_semana: 0,
    receita_mes: 0,
    ticket_medio_mes: 0,
  }

  // Buscar top produtos via RPC
  const { data: topProdutosRaw } = await supabase.rpc('get_top_produtos', {
    p_restaurant_id: restaurant.id,
    p_limit: 10,
  })
  const topProdutos: TopProduto[] = topProdutosRaw ?? []

  // Buscar horários de pico via RPC
  const { data: horariosPicoRaw } = await supabase.rpc('get_horarios_pico', {
    p_restaurant_id: restaurant.id,
  })
  const horariosPico: HorarioPico[] = horariosPicoRaw ?? []

  const maxPedidosHora = horariosPico.reduce((max, h) => Math.max(max, h.pedidos), 1)

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Métricas de vendas de <strong>{restaurant.nome}</strong>
        </p>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Pedidos hoje"
          value={String(analytics.pedidos_hoje)}
          sub={`${analytics.pedidos_semana} esta semana`}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Receita hoje"
          value={formatCurrency(Number(analytics.receita_hoje))}
          sub={`${formatCurrency(Number(analytics.receita_semana))} esta semana`}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Receita no mês"
          value={formatCurrency(Number(analytics.receita_mes))}
          sub={`${analytics.pedidos_mes} pedidos no mês`}
        />
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="Ticket médio (mês)"
          value={formatCurrency(Number(analytics.ticket_medio_mes))}
          sub="Média por pedido no mês"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Produtos */}
        <section className="bg-card border-border rounded-xl border p-6">
          <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
            <Package className="text-primary h-5 w-5" />
            Produtos mais vendidos (mês)
          </h2>
          {topProdutos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum produto vendido neste mês.</p>
          ) : (
            <ol className="space-y-3">
              {topProdutos.map((produto, idx) => (
                <li key={produto.produto_id} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-5 text-right text-sm font-medium">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{produto.nome}</p>
                    <p className="text-muted-foreground text-xs">
                      {produto.quantidade}× · {formatCurrency(Number(produto.receita))}
                    </p>
                  </div>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                    {produto.quantidade}×
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Horários de Pico */}
        <section className="bg-card border-border rounded-xl border p-6">
          <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
            <Clock className="text-primary h-5 w-5" />
            Horários de pico (mês)
          </h2>
          {horariosPico.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum pedido registrado neste mês.</p>
          ) : (
            <div className="space-y-2">
              {horariosPico.map((h) => (
                <div key={h.hora} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-12 shrink-0 text-right text-xs">
                    {String(h.hora).padStart(2, '0')}h
                  </span>
                  <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${(h.pedidos / maxPedidosHora) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-6 shrink-0 text-right text-xs">
                    {h.pedidos}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Subcomponente MetricCard ─────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-card border-border rounded-xl border p-5">
      <div className="text-primary mb-2 flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className="text-foreground text-2xl font-bold">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{sub}</p>
    </div>
  )
}

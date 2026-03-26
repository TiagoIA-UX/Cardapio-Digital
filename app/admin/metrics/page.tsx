'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Bot } from 'lucide-react'

interface Metrics {
  totalRestaurants: number
  activeSubscriptions: number
  mrr: number
  activationRate: number
}

interface AIMetrics {
  totalEscalations: number
  pendingEscalations: number
  resolvedEscalations: number
  resolutionRate: number
  totalLearningEntries: number
}

export default function AdminMetricsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Opcional: simples proteção por email (ajuste para o seu)
      // if (session.user.email !== "seu-email-aqui") { setLoading(false); return }

      const { data: restaurantsRes, count: restCount } = await supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })

      const { data: subs } = await supabase.from('subscriptions').select('status, plan_id')

      const { data: plans } = await supabase.from('plans').select('id, price_month')

      const { data: activatedRes } = await supabase
        .from('activation_events')
        .select('restaurant_id')
        .eq('event_type', 'received_first_order')

      const totalRestaurants = restCount || 0
      const activeSubscriptions = (subs || []).filter(
        (s: { status: string }) => s.status === 'active'
      ).length

      const planPriceMap = new Map<string, number>()
      ;(plans || []).forEach((p: { id: string; price_month: number }) =>
        planPriceMap.set(p.id, Number(p.price_month))
      )

      let mrr = 0
      ;(subs || []).forEach((s: { status: string; plan_id?: string }) => {
        if (s.status === 'active' && s.plan_id && planPriceMap.has(s.plan_id)) {
          mrr += planPriceMap.get(s.plan_id) || 0
        }
      })

      const activatedRestaurants = new Set(
        (activatedRes || []).map((e: { restaurant_id: string }) => e.restaurant_id)
      ).size
      const activationRate =
        totalRestaurants > 0 ? (activatedRestaurants / totalRestaurants) * 100 : 0

      const { count: totalEscalations } = await supabase
        .from('ai_escalations')
        .select('id', { count: 'exact', head: true })

      const { count: pendingEscalations } = await supabase
        .from('ai_escalations')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false)

      const { count: resolvedEscalations } = await supabase
        .from('ai_escalations')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', true)

      const { count: totalLearningEntries } = await supabase
        .from('ai_learning_entries')
        .select('id', { count: 'exact', head: true })

      const resolutionRate =
        (totalEscalations || 0) > 0
          ? ((resolvedEscalations || 0) / (totalEscalations || 0)) * 100
          : 0

      setMetrics({
        totalRestaurants,
        activeSubscriptions,
        mrr,
        activationRate,
      })
      setAiMetrics({
        totalEscalations: totalEscalations || 0,
        pendingEscalations: pendingEscalations || 0,
        resolvedEscalations: resolvedEscalations || 0,
        resolutionRate,
        totalLearningEntries: totalLearningEntries || 0,
      })
      setLoading(false)
    }

    void load()
  }, [supabase])

  if (loading) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </main>
    )
  }

  if (!metrics) {
    return (
      <main className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar as métricas. Verifique se você está autenticado.
        </p>
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-foreground mb-6 text-2xl font-bold">Métricas do SaaS</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Total de restaurantes</p>
            <p className="text-foreground text-2xl font-bold">{metrics.totalRestaurants}</p>
          </div>

          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Assinaturas ativas</p>
            <p className="text-foreground text-2xl font-bold">{metrics.activeSubscriptions}</p>
          </div>

          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">MRR estimado</p>
            <p className="text-foreground text-2xl font-bold">
              R$ {metrics.mrr.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="bg-card border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Taxa de ativação</p>
            <p className="text-foreground text-2xl font-bold">
              {metrics.activationRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {aiMetrics && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              <h2 className="text-foreground text-xl font-semibold">Métricas de IA</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Escalações totais</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.totalEscalations}</p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Escalações pendentes</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.pendingEscalations}</p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Escalações resolvidas</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.resolvedEscalations}</p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4">
                <p className="text-muted-foreground mb-1 text-sm">Taxa de resolução</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.resolutionRate.toFixed(1)}%</p>
              </div>

              <div className="bg-card border-border rounded-xl border p-4 md:col-span-2 lg:col-span-2">
                <p className="text-muted-foreground mb-1 text-sm">Entradas de aprendizado</p>
                <p className="text-foreground text-2xl font-bold">{aiMetrics.totalLearningEntries}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

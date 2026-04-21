'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Filter,
  Info,
  Loader2,
  MessageCircle,
  RadioTower,
  Shield,
  XCircle,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Alert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  channel: string
  title: string
  body: string
  metadata: Record<string, unknown>
  whatsapp_link: string | null
  read: boolean
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

interface AlertAction {
  id: string
  label: string
  endpoint: string
  method: 'POST'
  tone: 'primary' | 'warning' | 'neutral'
  payload: Record<string, unknown>
}

interface ActionResult {
  error?: string
  success_message?: string
  open_url?: string | null
}

interface Summary {
  unread_total: number
  unread_critical: number
  unread_warning: number
  unread_info: number
  last_24h: number
  last_7d: number
}

interface AlertStats {
  top_sources: { source: string; total: number; critical: number; warning: number; info: number }[]
  hourly_freq: { hour: string; total: number; critical: number }[]
  severity: { total: number; critical: number; warning: number; info: number; pct_critical: number }
  spam_suspects: { source: string; count_1h: number; first_seen: string }[]
  generated_at: string
}

// ── Config ───────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-600/30',
    label: 'Crítico',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-600/30',
    label: 'Alerta',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-600/30',
    label: 'Info',
  },
} as const

const CHANNEL_LABELS: Record<string, string> = {
  payment: '💳 Pagamento',
  subscription: '📋 Assinatura',
  cron: '⚙️ Cron',
  security: '🔒 Segurança',
  onboarding: '🚀 Onboarding',
  affiliate: '🤝 Afiliados',
  system: '🖥️ Sistema',
}

// ── Helper ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminAlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null)
  const [processingActionId, setProcessingActionId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [filter, setFilter] = useState<{ severity?: string; channel?: string; unread?: boolean }>(
    {}
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const applyResolvedAlertLocally = useCallback(
    (alertId: string) => {
      setAlerts((current) => current.filter((alert) => alert.id !== alertId))
      setExpandedId((current) => (current === alertId ? null : current))
      setSummary((current) => {
        if (!current) return current

        const target = alerts.find((alert) => alert.id === alertId)
        if (!target) return current

        return {
          ...current,
          unread_total: Math.max(0, current.unread_total - (target.read ? 0 : 1)),
          unread_critical:
            target.severity === 'critical' && !target.read
              ? Math.max(0, current.unread_critical - 1)
              : current.unread_critical,
          unread_warning:
            target.severity === 'warning' && !target.read
              ? Math.max(0, current.unread_warning - 1)
              : current.unread_warning,
          unread_info:
            target.severity === 'info' && !target.read
              ? Math.max(0, current.unread_info - 1)
              : current.unread_info,
        }
      })
    },
    [alerts]
  )

  const getActionSuccessMessage = (action: AlertAction) => {
    const operation = action.payload.action
    if (operation === 'start_trial') {
      return 'Trial aplicado com sucesso e alerta resolvido.'
    }
    if (operation === 'block_until_payment') {
      return 'Delivery bloqueado até regularização financeira e alerta resolvido.'
    }
    if (operation === 'resend_payment_link') {
      return 'Link pronto para envio ao cliente e alerta resolvido.'
    }
    if (operation === 'mark_waiting_customer') {
      return 'Caso marcado como aguardando cliente e alerta resolvido.'
    }
    return 'Caso registrado para análise manual auditada.'
  }

  const executeAlertAction = async (alertId: string, action: AlertAction) => {
    setProcessingAlertId(alertId)
    setProcessingActionId(action.id)
    setActionFeedback(null)

    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...action.payload, alert_id: alertId }),
      })

      const result = (await response.json().catch(() => ({}))) as ActionResult

      if (!response.ok) {
        setActionFeedback({
          type: 'error',
          message: result.error || 'Não foi possível aplicar a ação selecionada.',
        })
        return
      }

      setActionFeedback({
        type: 'success',
        message: result.success_message || getActionSuccessMessage(action),
      })
      applyResolvedAlertLocally(alertId)
      if (result.open_url) {
        window.open(result.open_url, '_blank', 'noopener,noreferrer')
      }
      await loadData()
    } finally {
      setProcessingAlertId(null)
      setProcessingActionId(null)
    }
  }

  const getAlertActions = (alert: Alert): AlertAction[] => {
    const rawActions = Array.isArray(alert.metadata?.actions) ? alert.metadata.actions : []
    return rawActions.filter((value): value is AlertAction => {
      if (!value || typeof value !== 'object') return false
      const candidate = value as Record<string, unknown>
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.label === 'string' &&
        typeof candidate.endpoint === 'string' &&
        candidate.method === 'POST' &&
        typeof candidate.payload === 'object' &&
        candidate.payload !== null
      )
    })
  }

  const loadData = useCallback(async () => {
    const params = new URLSearchParams()
    if (filter.severity) params.set('severity', filter.severity)
    if (filter.channel) params.set('channel', filter.channel)
    if (filter.unread) params.set('unread', 'true')

    const [alertsRes, statsRes] = await Promise.all([
      fetch(`/api/admin/alertas?${params}`),
      fetch('/api/admin/alertas/stats'),
    ])

    if (alertsRes.ok) {
      const data = await alertsRes.json()
      setAlerts(data.alerts ?? [])
      setSummary(data.summary ?? null)
    }
    if (statsRes.ok) {
      const data = await statsRes.json()
      setStats(data)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadData()
    }, 0)
    const interval = setInterval(() => {
      void loadData()
    }, 30000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [loadData])

  const performAction = async (action: string, alertId?: string) => {
    setActionLoading(true)
    await fetch('/api/admin/alertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, alert_id: alertId }),
    })

    if (action === 'resolve' && alertId) {
      applyResolvedAlertLocally(alertId)
    }

    await loadData()
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-6 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <Bell className="mr-2 inline h-6 w-6 text-yellow-400" />
            Central de Alertas
          </h1>
          <p className="text-sm text-zinc-400">Monitoramento em tempo real de eventos do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          {summary && summary.unread_total > 0 && (
            <button
              onClick={() => performAction('mark_all_read')}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              <BellOff className="h-4 w-4" />
              Marcar tudo como lido
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionFeedback.type === 'success'
              ? 'border-green-600/30 bg-green-500/10 text-green-300'
              : 'border-red-600/30 bg-red-500/10 text-red-300'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <SummaryCard
            label="Não Lidos"
            value={summary.unread_total}
            color="text-white"
            bg="bg-zinc-800"
          />
          <SummaryCard
            label="Críticos"
            value={summary.unread_critical}
            color="text-red-400"
            bg="bg-red-500/10"
          />
          <SummaryCard
            label="Alertas"
            value={summary.unread_warning}
            color="text-yellow-400"
            bg="bg-yellow-500/10"
          />
          <SummaryCard
            label="Info"
            value={summary.unread_info}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
          <SummaryCard
            label="Últimas 24h"
            value={summary.last_24h}
            color="text-zinc-300"
            bg="bg-zinc-800"
          />
          <SummaryCard
            label="Últimos 7d"
            value={summary.last_7d}
            color="text-zinc-300"
            bg="bg-zinc-800"
          />
        </div>
      )}

      {/* Radar de Operação */}
      {stats && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-purple-400" />
            <h2 className="font-semibold text-zinc-200">Radar de Operação</h2>
            <span className="ml-auto text-xs text-zinc-600">7 dias</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Breakdown de severidade */}
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                Distribuição
              </p>
              <div className="flex items-end gap-3">
                <span
                  className={`text-4xl font-bold ${(stats.severity.pct_critical ?? 0) > 20 ? 'text-red-400' : 'text-zinc-200'}`}
                >
                  {stats.severity.pct_critical ?? 0}%
                </span>
                <span className="mb-1 text-sm text-zinc-500">críticos</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="w-(--bar-crit) bg-red-500 transition-all"
                  style={
                    {
                      '--bar-crit': `${stats.severity.total ? (stats.severity.critical / stats.severity.total) * 100 : 0}%`,
                    } as React.CSSProperties
                  }
                />
                <div
                  className="w-(--bar-warn) bg-yellow-500 transition-all"
                  style={
                    {
                      '--bar-warn': `${stats.severity.total ? (stats.severity.warning / stats.severity.total) * 100 : 0}%`,
                    } as React.CSSProperties
                  }
                />
                <div
                  className="w-(--bar-info) bg-blue-500 transition-all"
                  style={
                    {
                      '--bar-info': `${stats.severity.total ? (stats.severity.info / stats.severity.total) * 100 : 0}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
              <div className="flex gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {stats.severity.critical} crit
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  {stats.severity.warning} warn
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {stats.severity.info} info
                </span>
              </div>
            </div>

            {/* Top 5 fontes */}
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                Top Fontes
              </p>
              {stats.top_sources.length === 0 ? (
                <p className="text-sm text-zinc-600">Nenhum dado</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.top_sources.map((s) => {
                    const max = stats.top_sources[0]?.total ?? 1
                    return (
                      <div key={s.source} className="flex items-center gap-2">
                        <div className="w-24 shrink-0 truncate text-xs text-zinc-400">
                          {s.source}
                        </div>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="absolute inset-y-0 left-0 w-(--bar-src) rounded-full bg-purple-500"
                            style={
                              { '--bar-src': `${(s.total / max) * 100}%` } as React.CSSProperties
                            }
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-zinc-500">{s.total}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Suspeitas de spam + frequência 24h */}
            <div className="space-y-3">
              {stats.spam_suspects.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wider text-yellow-500 uppercase">
                    ⚠ Suspeita de spam (última hora)
                  </p>
                  {stats.spam_suspects.map((s) => (
                    <div key={s.source} className="text-xs text-zinc-400">
                      <span className="text-yellow-400">{s.source}</span>:{' '}
                      <span className="font-bold text-yellow-300">{s.count_1h}x</span>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wider text-zinc-500 uppercase">
                  Frequência 24h
                </p>
                {stats.hourly_freq.length === 0 ? (
                  <p className="text-xs text-zinc-600">Sem alertas nas últimas 24h</p>
                ) : (
                  <div className="flex h-10 items-end gap-0.5">
                    {stats.hourly_freq.map((h) => {
                      const maxHour = Math.max(...stats.hourly_freq.map((x) => x.total), 1)
                      return (
                        <div
                          key={h.hour}
                          title={`${h.hour}: ${h.total} alertas`}
                          className={`h-(--bar-h) flex-1 rounded-sm transition-all ${h.critical > 0 ? 'bg-red-500/70' : 'bg-zinc-600'}`}
                          style={
                            {
                              '--bar-h': `${Math.max(4, (h.total / maxHour) * 100)}%`,
                            } as React.CSSProperties
                          }
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <Filter className="h-4 w-4 text-zinc-500" />
        <select
          value={filter.severity ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, severity: e.target.value || undefined }))}
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
          title="Filtrar por severidade"
        >
          <option value="">Todas severidades</option>
          <option value="critical">Crítico</option>
          <option value="warning">Alerta</option>
          <option value="info">Info</option>
        </select>
        <select
          value={filter.channel ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, channel: e.target.value || undefined }))}
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
          title="Filtrar por canal"
        >
          <option value="">Todos canais</option>
          <option value="payment">Pagamento</option>
          <option value="subscription">Assinatura</option>
          <option value="cron">Cron</option>
          <option value="affiliate">Afiliados</option>
          <option value="system">Sistema</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={filter.unread ?? false}
            onChange={(e) => setFilter((f) => ({ ...f, unread: e.target.checked || undefined }))}
            className="rounded"
          />
          Só não lidos
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-green-500/50" />
            <p className="text-zinc-400">Nenhum alerta encontrado</p>
            <p className="mt-1 text-sm text-zinc-600">Tudo funcionando normalmente</p>
          </div>
        ) : (
          alerts.map((a) => {
            const cfg = SEVERITY_CONFIG[a.severity]
            const Icon = cfg.icon
            const isExpanded = expandedId === a.id
            const alertActions = getAlertActions(a)

            return (
              <div
                key={a.id}
                className={`rounded-xl border ${a.read ? 'border-zinc-800' : cfg.border} ${a.read ? 'bg-zinc-900/50' : 'bg-zinc-900'} overflow-hidden transition-all`}
              >
                {/* Main row */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-4"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className={`rounded-lg p-2 ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!a.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      <p className={`font-medium ${a.read ? 'text-zinc-400' : 'text-zinc-100'}`}>
                        {a.title}
                      </p>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                      <span>{CHANNEL_LABELS[a.channel] ?? a.channel}</span>
                      <span>·</span>
                      <span>{timeAgo(a.created_at)}</span>
                      {a.resolved && (
                        <>
                          <span>·</span>
                          <span className="text-green-500">✓ Resolvido</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 pt-3 pb-4">
                    <pre className="mb-3 text-sm whitespace-pre-wrap text-zinc-300">{a.body}</pre>
                    {a.metadata && Object.keys(a.metadata).length > 0 && (
                      <details className="mb-3">
                        <summary className="cursor-pointer text-xs text-zinc-500">Metadata</summary>
                        <pre className="mt-1 rounded bg-zinc-800/50 p-2 text-xs text-zinc-400">
                          {JSON.stringify(a.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                    {alertActions.length > 0 && !a.resolved && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {alertActions.map((action) => {
                          const toneClass =
                            action.tone === 'primary'
                              ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30'
                              : action.tone === 'warning'
                                ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          const isProcessingThisAlert = processingAlertId === a.id
                          const isProcessingThisAction = processingActionId === action.id
                          const isRecommended = action.tone === 'primary'

                          return (
                            <button
                              key={action.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                executeAlertAction(a.id, action)
                              }}
                              disabled={actionLoading || isProcessingThisAlert}
                              className={`rounded px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {isProcessingThisAction && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                <span>{action.label}</span>
                                {isRecommended && (
                                  <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] tracking-wide text-blue-200 uppercase">
                                    Recomendado
                                  </span>
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {!a.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            performAction('mark_read', a.id)
                          }}
                          disabled={actionLoading}
                          className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                        >
                          Marcar como lido
                        </button>
                      )}
                      {!a.resolved && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            performAction('resolve', a.id)
                          }}
                          disabled={actionLoading}
                          className="rounded bg-green-600/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-600/30 disabled:opacity-50"
                        >
                          <CheckCircle className="mr-1 inline h-3 w-3" />
                          Resolver
                        </button>
                      )}
                      {a.whatsapp_link && (
                        <a
                          href={a.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded bg-green-600/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-600/30"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
  bg,
}: {
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`rounded-xl ${bg} border border-zinc-800 p-4`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

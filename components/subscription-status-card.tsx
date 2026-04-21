'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Clock, Loader2, Lock, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getRestaurantScopedHref } from '@/lib/domains/core/active-restaurant'
import { getPublicPlanDisplay } from '@/lib/domains/marketing/plan-display'
import type { SubscriptionPlanSlug } from '@/lib/domains/marketing/pricing'
import {
  formatAccessUntilLabel,
  getDaysUntilDate,
  isFutureScheduledCancellation,
  resolveSubscriptionAccessUntil,
} from '@/lib/domains/core/subscription/account-subscription'
import { createClient } from '@/lib/shared/supabase/client'

interface SubscriptionStatus {
  can_edit: boolean
  is_blocked: boolean
  reason?: string
  days_until_block?: number
  subscription_status?: string
}

interface SubscriptionInfo {
  id: string
  status: string
  plan_slug?: string | null
  current_period_end?: string | null
  current_period_start?: string | null
  trial_ends_at?: string | null
  mp_subscription_status?: string
  last_payment_date?: string | null
  next_payment_date?: string | null
  failed_payments?: number | null
  cancel_at?: string | null
  canceled_at?: string | null
}

function resolvePublicPlanName(planSlug: string | null | undefined): string | null {
  const normalized = planSlug?.trim().toLowerCase()
  if (!normalized) return null

  const knownPlanSlugs: SubscriptionPlanSlug[] = ['semente', 'basico', 'pro', 'premium']
  if (knownPlanSlugs.includes(normalized as SubscriptionPlanSlug)) {
    return getPublicPlanDisplay(normalized as SubscriptionPlanSlug).name
  }

  return normalized.toUpperCase()
}

export function SubscriptionStatusCard({ restaurantId }: { restaurantId?: string }) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const loadSubscriptionStatus = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }
    setLoading(true)

    try {
      // 1. Verificar se pode editar
      const { data: canEdit, error: canEditErr } = await supabase.rpc('can_edit_restaurant', {
        p_restaurant_id: restaurantId,
      })

      if (canEditErr) {
        console.error('Erro ao verificar access:', canEditErr)
        setLoading(false)
        return
      }

      setSubscriptionStatus(canEdit?.[0] || null)

      // 2. Buscar detalhes da assinatura
      const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .select(
          'id, status, plan_slug, trial_ends_at, current_period_start, current_period_end, mp_subscription_status, last_payment_date, next_payment_date, failed_payments, cancel_at, canceled_at'
        )
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!subErr && subData) {
        setSubscriptionInfo(subData as SubscriptionInfo)
      }
    } catch (err) {
      console.error('Erro ao carregar subscription:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurantId, supabase])

  useEffect(() => {
    void loadSubscriptionStatus()
  }, [loadSubscriptionStatus])

  const accessUntilDate = useMemo(
    () => resolveSubscriptionAccessUntil(subscriptionInfo),
    [subscriptionInfo]
  )

  const daysUntilExpiry = useMemo(() => getDaysUntilDate(accessUntilDate), [accessUntilDate])

  const scheduledCancellation = useMemo(
    () => isFutureScheduledCancellation(subscriptionInfo?.cancel_at),
    [subscriptionInfo?.cancel_at]
  )

  const accessUntilLabel = formatAccessUntilLabel(accessUntilDate)
  const publicPlanName = resolvePublicPlanName(subscriptionInfo?.plan_slug)

  const handleCancelSubscription = async () => {
    if (!restaurantId) return
    setCancelling(true)

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          reason: cancelReason,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShowCancelModal(false)
        setCancelReason('')
        toast({
          title: 'Renovação automática cancelada',
          description: data?.message || `Seu acesso continua ativo até ${accessUntilLabel}.`,
        })
        await loadSubscriptionStatus()
      } else {
        const error = await response.json()
        toast({
          title: 'Não foi possível cancelar',
          description: error.error || 'Tente novamente em instantes.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Erro:', err)
      toast({
        title: 'Erro ao cancelar assinatura',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setCancelling(false)
    }
  }

  if (!restaurantId) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-card border-border rounded-xl border p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando sua assinatura...</span>
        </div>
      </div>
    )
  }

  // Status BLOQUEADO
  if (subscriptionStatus?.is_blocked) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="mb-4 flex items-start gap-3">
          <Lock className="mt-1 h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900">Cardápio Bloqueado</h3>
            <p className="mt-1 text-sm text-red-800">{subscriptionStatus.reason}</p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-white/50 p-3">
          <p className="text-sm text-gray-700">
            <strong>Motivo:</strong> {subscriptionStatus.reason}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={getRestaurantScopedHref('/painel/planos', restaurantId)}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-red-700"
          >
            Renovar Assinatura
          </Link>
        </div>
      </div>
    )
  }

  // Status ATIVO - Mostrar dias até vencer
  if (subscriptionStatus?.can_edit && subscriptionInfo) {
    const isWarning = daysUntilExpiry !== null && daysUntilExpiry <= 7
    const isCritical = daysUntilExpiry !== null && daysUntilExpiry <= 3

    return (
      <div
        className={`border-border rounded-xl border p-6 ${
          isCritical ? 'bg-orange-50' : isWarning ? 'bg-yellow-50' : 'bg-green-50'
        }`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            {isCritical ? (
              <AlertCircle className="mt-1 h-5 w-5 text-orange-600" />
            ) : isWarning ? (
              <Clock className="mt-1 h-5 w-5 text-yellow-600" />
            ) : (
              <Check className="mt-1 h-5 w-5 text-green-600" />
            )}
            <div>
              <h3
                className={`font-bold ${
                  isCritical ? 'text-orange-900' : isWarning ? 'text-yellow-900' : 'text-green-900'
                }`}
              >
                Sua Assinatura
              </h3>
              <p
                className={`mt-1 text-sm ${
                  isCritical ? 'text-orange-800' : isWarning ? 'text-yellow-800' : 'text-green-800'
                }`}
              >
                {subscriptionInfo.status === 'active' ? 'Ativa' : 'Trial'} •{' '}
                {daysUntilExpiry === 0
                  ? 'Vence hoje'
                  : daysUntilExpiry === 1
                    ? 'Vence amanhã'
                    : `Vence em ${daysUntilExpiry} dias`}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-lg bg-white/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium capitalize">
              {subscriptionInfo.status === 'active' ? '✅ Ativo' : '⏱️ Trial'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Acesso liberado até:</span>
            <span className="font-medium">{accessUntilLabel}</span>
          </div>
          {publicPlanName ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Plano:</span>
              <span className="font-medium">{publicPlanName}</span>
            </div>
          ) : null}
          {subscriptionInfo.next_payment_date && !scheduledCancellation ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Próxima cobrança:</span>
              <span className="font-medium">
                {new Date(subscriptionInfo.next_payment_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          ) : null}
          {subscriptionInfo.last_payment_date && (
            <div className="flex justify-between">
              <span className="text-gray-600">Último pagamento:</span>
              <span className="font-medium">
                {new Date(subscriptionInfo.last_payment_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {scheduledCancellation ? (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-900">
              A renovação automática já foi cancelada.
            </p>
            <p className="mt-1 text-sm text-blue-800">
              Seu painel continua liberado até {accessUntilLabel}. Depois disso, a assinatura não
              será renovada automaticamente.
            </p>
          </div>
        ) : null}

        {isCritical && (
          <div className="mb-4 border-l-4 border-orange-600 bg-orange-100 p-3">
            <p className="text-sm font-medium text-orange-900">
              ⚠️ Seu cardápio será bloqueado em breve. Renove sua assinatura agora!
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href={getRestaurantScopedHref('/painel/planos', restaurantId)}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isWarning ? 'Revisar plano agora' : 'Ver planos'}
          </Link>
          {!scheduledCancellation ? (
            <button
              onClick={() => setShowCancelModal(true)}
              className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              Cancelar renovação
            </button>
          ) : null}
        </div>

        {/* Modal de cancelamento */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-xl font-bold">Cancelar Assinatura</h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  aria-label="Fechar modal de cancelamento"
                  title="Fechar"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-3 text-gray-600">
                A renovação automática será encerrada e seu acesso continua ativo até{' '}
                <strong>{accessUntilLabel}</strong>.
              </p>
              <p className="mb-4 text-sm text-gray-500">
                Isso evita nova cobrança no próximo ciclo, sem bloquear o painel imediatamente.
              </p>

              <textarea
                placeholder="Por que cancelar? (opcional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="border-border mb-4 w-full rounded-lg border p-3 text-sm"
                rows={3}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-lg border px-4 py-2 font-medium transition-colors hover:bg-gray-100"
                >
                  Manter renovação
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Salvando...' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

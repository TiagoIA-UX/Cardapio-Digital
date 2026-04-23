import { NextRequest, NextResponse } from 'next/server'
import { validateMercadoPagoWebhookSignature } from '@/lib/domains/core/mercadopago-webhook'
import {
  fetchPreapprovalWithTimeoutAndRetry,
  mapMercadoPagoSubscriptionStatus,
  parseExternalReferenceDiagnostic,
  validatePreapprovalFinancialConsistency,
  validatePreapprovalOwnership,
} from '@/lib/domains/core/mercadopago-webhook-processing'
import { SubscriptionWebhookSchema, zodErrorResponse } from '@/lib/domains/core/schemas'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const WEBHOOK_PROVIDER = 'mercadopago_subscription'

// ── Log estruturado (JSON → stdout) ───────────────────────────────────────
type SLogLevel = 'info' | 'warn' | 'error'
function logSubEvent(level: SLogLevel, event: string, data: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'webhook/subscriptions',
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

// Marca notificação como processada na tabela de idempotência
async function markSubscriptionWebhookProcessed(
  admin: ReturnType<typeof createAdminClient>,
  rowId: string,
  ignoredReason?: string | null
) {
  if (!rowId) return
  await admin
    .from('webhook_events')
    .update({
      status: ignoredReason ? 'skipped' : 'processed',
      ignored_reason: ignoredReason || null,
      applied_at: ignoredReason ? null : new Date().toISOString(),
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', rowId)
}

async function markSubscriptionWebhookFailed(
  admin: ReturnType<typeof createAdminClient>,
  rowId: string,
  errorMessage: string
) {
  if (!rowId) return
  await admin
    .from('webhook_events')
    .update({
      status: 'failed',
      error_message: errorMessage.slice(0, 500),
      processed_at: new Date().toISOString(),
    })
    .eq('id', rowId)
}

export async function POST(request: NextRequest) {
  let currentEventRowId: string | null = null
  try {
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    const body = await request.json()

    // Validar estrutura do payload
    const parsed = SubscriptionWebhookSchema.safeParse(body)
    if (!parsed.success) {
      return zodErrorResponse(parsed.error)
    }

    // Mercado Pago envia diferentes tipos de notificação
    const { type, data, action } = parsed.data
    const raw = parsed.data as Record<string, unknown>
    const id = (raw.id as string | undefined) ?? null
    const resource_id = (raw.resource_id as string | undefined) ?? null
    const date_created = (raw.date_created as string | undefined) ?? null
    const eventId = id || null
    const resourceId = resource_id || data?.id || null
    const resourceType = type === 'subscription_authorized_payment' ? 'payment' : 'preapproval'

    logSubEvent('info', 'subscription_webhook_received', {
      type,
      action,
      event_id: eventId,
      resource_id: resourceId,
    })

    if (
      !['subscription_preapproval', 'preapproval', 'subscription_authorized_payment'].includes(type)
    ) {
      return NextResponse.json({ received: true })
    }

    if (!eventId) {
      return NextResponse.json({ error: 'event.id ausente' }, { status: 400 })
    }

    if (!resourceId) {
      return NextResponse.json({ error: 'resource_id ausente' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: insertedEvent, error: insertError } = await supabaseAdmin
      .from('webhook_events')
      .upsert(
        {
          provider: WEBHOOK_PROVIDER,
          event_id: eventId,
          event_type: type,
          resource_id: String(resourceId),
          resource_type: resourceType,
          provider_event_created_at: date_created || null,
          status: 'received',
          payload: body,
          error_message: null,
          processed_at: null,
        },
        {
          onConflict: 'provider,event_id',
          ignoreDuplicates: true,
        }
      )
      .select('id')
      .maybeSingle()

    if (insertError) {
      throw insertError
    }

    if (!insertedEvent?.id) {
      logSubEvent('info', 'subscription_webhook_duplicate_skipped', { event_id: eventId })
      return NextResponse.json({ received: true, duplicate: true })
    }

    currentEventRowId = insertedEvent.id

    const webhookSecret = process.env.MP_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('subscription_webhook_secret_missing')
    }

    const isValid = validateMercadoPagoWebhookSignature(
      xSignature,
      xRequestId,
      String(resourceId),
      webhookSecret
    )

    if (!isValid) {
      throw new Error('subscription_webhook_signature_invalid')
    }

    if (type === 'subscription_authorized_payment') {
      if (!currentEventRowId) {
        throw new Error('subscription_webhook_event_row_missing')
      }

      await markSubscriptionWebhookProcessed(
        supabaseAdmin,
        currentEventRowId,
        'payment_event_not_authoritative'
      )

      logSubEvent('info', 'subscription_payment_event_recorded', {
        event_id: eventId,
        resource_id: resourceId,
      })

      return NextResponse.json({
        received: true,
        ignored: 'payment_event_not_authoritative',
      })
    }

    const preapproval = await fetchPreapprovalWithTimeoutAndRetry(String(resourceId))
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select(
        'id, status, mp_preapproval_id, contract_hash, contracted_monthly_amount, billing_model'
      )
      .eq('mp_preapproval_id', preapproval.id)
      .maybeSingle()

    if (subscriptionError) {
      throw subscriptionError
    }

    if (!subscription) {
      throw new Error('subscription_not_found')
    }

    const ownership = validatePreapprovalOwnership(
      preapproval.externalReference,
      subscription.billing_model || null
    )
    const diagnosticRef = parseExternalReferenceDiagnostic(preapproval.externalReference)

    const financialValidation = validatePreapprovalFinancialConsistency({
      currencyId: preapproval.autoRecurring.currencyId,
      mpAmount: preapproval.autoRecurring.transactionAmount,
      contractedAmount:
        typeof subscription.contracted_monthly_amount === 'number'
          ? subscription.contracted_monthly_amount
          : subscription.contracted_monthly_amount != null
            ? Number(subscription.contracted_monthly_amount)
            : null,
      tolerance: 0.01,
    })

    if (!financialValidation.ok) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          last_value_validated_at: new Date().toISOString(),
          last_value_validation_error: financialValidation.reason,
        })
        .eq('id', subscription.id)

      throw new Error(financialValidation.reason)
    }

    const mapped = mapMercadoPagoSubscriptionStatus({
      mpStatus: preapproval.status,
      freeTrialEndDate: preapproval.autoRecurring.freeTrialEndDate,
      startDate: preapproval.autoRecurring.startDate,
    })

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'apply_subscription_webhook_event',
      {
        p_mp_preapproval_id: preapproval.id,
        p_event_id: eventId,
        p_event_at: preapproval.lastModified || date_created || new Date().toISOString(),
        p_target_status: mapped.status,
        p_target_status_rank: mapped.rank,
        p_mp_subscription_status: preapproval.status,
        p_contract_hash: diagnosticRef.contractHash,
        p_contracted_monthly_amount: preapproval.autoRecurring.transactionAmount,
        p_payload: body,
        p_trial_ends_at: preapproval.autoRecurring.freeTrialEndDate,
        p_last_payment_date: preapproval.lastModified,
        p_next_payment_date: preapproval.nextPaymentDate,
      }
    )

    if (rpcError) {
      throw rpcError
    }

    const rpcRow = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult
    if (rpcRow?.ignored) {
      if (!currentEventRowId) {
        throw new Error('subscription_webhook_event_row_missing')
      }

      await markSubscriptionWebhookProcessed(
        supabaseAdmin,
        currentEventRowId,
        rpcRow.ignored_reason || 'ignored'
      )

      logSubEvent('info', 'subscription_webhook_ignored', {
        event_id: eventId,
        resource_id: resourceId,
        ignored_reason: rpcRow.ignored_reason,
        ownership_kind: ownership.kind,
      })

      return NextResponse.json({ received: true, ignored: rpcRow.ignored_reason })
    }

    if (!currentEventRowId) {
      throw new Error('subscription_webhook_event_row_missing')
    }

    await markSubscriptionWebhookProcessed(supabaseAdmin, currentEventRowId)
    logSubEvent('info', 'subscription_webhook_processed', {
      event_id: eventId,
      resource_id: resourceId,
      status: mapped.status,
      ownership_kind: ownership.kind,
    })

    return NextResponse.json({ success: true, status: mapped.status })
  } catch (error) {
    if (currentEventRowId) {
      await markSubscriptionWebhookFailed(
        createAdminClient(),
        currentEventRowId,
        error instanceof Error ? error.message : String(error)
      ).catch(() => undefined)
    }
    logSubEvent('error', 'subscription_webhook_error', { error: String(error) })
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}

// GET para verificação do Mercado Pago
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'subscription-webhook' })
}

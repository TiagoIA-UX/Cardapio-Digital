import { NextRequest, NextResponse } from 'next/server'
import { getValidatedMercadoPagoAccessToken } from '@/lib/domains/core/mercadopago'
import {
  formatAlreadyCancelledRenewalMessage,
  formatCancelledRenewalSuccessMessage,
  isFutureScheduledCancellation,
  resolveSubscriptionAccessUntil,
} from '@/lib/domains/core/subscription/account-subscription'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient } from '@/lib/shared/supabase/server'
import { z } from 'zod'

const CancelSubscriptionSchema = z.object({
  restaurant_id: z.string().uuid(),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // ── Autenticação ──────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ── Validação do payload ──────────────────────────────────
    const body = await request.json()
    const parsed = CancelSubscriptionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { restaurant_id, reason } = parsed.data

    // ── Verificar ownership ───────────────────────────────────
    const { data: restaurant, error: restaurantErr } = await supabase
      .from('restaurants')
      .select('id, user_id, organization_id, nome, slug')
      .eq('id', restaurant_id)
      .single()

    if (restaurantErr || !restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    // Verificar se user é dono ou membro autorizado
    if (restaurant.user_id !== user.id) {
      const { data: memberCheck } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', restaurant.organization_id || '')
        .single()

      if (!memberCheck) {
        return NextResponse.json(
          { error: 'Você não tem permissão para cancelar esta assinatura' },
          { status: 403 }
        )
      }
    }

    // ── Buscar assinatura atual ───────────────────────────────
    const admin = createAdminClient()
    const { data: subscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select(
        'id, status, mp_preapproval_id, current_period_end, trial_ends_at, next_payment_date, cancel_at, canceled_at'
      )
      .eq('restaurant_id', restaurant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      console.error('Erro ao buscar assinatura:', subscriptionError)
      return NextResponse.json({ error: 'Erro ao localizar assinatura' }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    const accessUntil = resolveSubscriptionAccessUntil(subscription)

    if (isFutureScheduledCancellation(subscription.cancel_at)) {
      return NextResponse.json({
        success: true,
        message: formatAlreadyCancelledRenewalMessage(subscription.cancel_at),
        access_until: subscription.cancel_at,
      })
    }

    // ── Agendar encerramento da recorrência no fim do ciclo ───
    if (subscription.mp_preapproval_id && accessUntil) {
      const mpToken = await getValidatedMercadoPagoAccessToken()
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription.mp_preapproval_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${mpToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auto_recurring: {
              end_date: new Date(accessUntil).toISOString(),
            },
          }),
        }
      )

      if (!mpResponse.ok) {
        const errorText = await mpResponse.text()
        console.error('Erro ao cancelar recorrência no Mercado Pago:', errorText)
        return NextResponse.json(
          { error: 'Não foi possível encerrar a renovação automática agora' },
          { status: 502 }
        )
      }
    }

    const { error: updateErr } = await admin
      .from('subscriptions')
      .update({
        cancel_at: accessUntil,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateErr) {
      console.error('Erro ao cancelar subscription:', updateErr)
      return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 })
    }

    // ── Log para auditoria ───────────────────────────────────
    await admin.from('domain_logs').insert({
      user_id: user.id,
      restaurant_id,
      action: 'subscription_auto_renew_cancelled',
      details: {
        reason: reason || 'Sem motivo especificado',
        cancelled_at: new Date().toISOString(),
        access_until: accessUntil,
        restaurant_slug: restaurant.slug,
      },
    })

    return NextResponse.json({
      success: true,
      message: formatCancelledRenewalSuccessMessage(accessUntil),
      access_until: accessUntil,
    })
  } catch (error) {
    console.error('Erro em POST /api/subscription/cancel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 })
}

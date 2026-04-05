import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/shared/supabase/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  createMercadoPagoPreApprovalClient,
  getMercadoPagoAccessToken,
} from '@/lib/domains/core/mercadopago'
import { getSiteUrl } from '@/lib/shared/site-url'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/shared/rate-limit'
import { PUBLIC_SUBSCRIPTION_PRICES } from '@/lib/domains/marketing/pricing'
import { COMPANY_PAYMENT_DESCRIPTOR, PRODUCT_NAME } from '@/lib/shared/brand'

type PlanSlug = 'basico' | 'pro' | 'premium'
const VALID_PLANS: PlanSlug[] = ['basico', 'pro', 'premium']
const PLAN_ORDER: Record<PlanSlug, number> = { basico: 0, pro: 1, premium: 2 }

export async function POST(request: NextRequest) {
  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 3,
    windowMs: 60_000,
  })
  if (rateLimit.limited) return rateLimit.response

  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Faça login' }, { status: 401, headers: rateLimit.headers })
  }

  const body = await request.json()
  const newPlan = body.plan_slug as PlanSlug

  if (!newPlan || !VALID_PLANS.includes(newPlan)) {
    return NextResponse.json(
      { error: 'plan_slug deve ser basico, pro ou premium' },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const admin = createAdminClient()

  // Buscar restaurante do usuário
  const { data: restaurant, error: restErr } = await admin
    .from('restaurants')
    .select('id, plan_slug, nome, user_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (restErr || !restaurant) {
    return NextResponse.json(
      { error: 'Delivery não encontrado' },
      { status: 404, headers: rateLimit.headers }
    )
  }

  const currentPlan = (restaurant.plan_slug as PlanSlug) || 'basico'
  if (currentPlan === newPlan) {
    return NextResponse.json(
      { error: 'Você já está neste plano' },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const isUpgrade = PLAN_ORDER[newPlan] > PLAN_ORDER[currentPlan]

  // Buscar assinatura ativa
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('id, mp_preapproval_id, status')
    .eq('restaurant_id', restaurant.id)
    .in('status', ['active', 'pending', 'trial'])
    .single()

  const preApproval = createMercadoPagoPreApprovalClient(10_000)
  const siteUrl = getSiteUrl()

  // Se tem assinatura ativa no MP, atualizar o valor via PUT /preapproval/{id}
  // A API do MP permite alterar auto_recurring.transaction_amount na mesma assinatura
  if (subscription?.mp_preapproval_id) {
    try {
      const newPrice =
        PUBLIC_SUBSCRIPTION_PRICES[newPlan as keyof typeof PUBLIC_SUBSCRIPTION_PRICES].monthly

      // Usar a API do MP para atualizar o valor da assinatura existente
      // PUT /preapproval/{id} com auto_recurring.transaction_amount + currency_id
      const mpToken = getMercadoPagoAccessToken()
      const updateRes = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription.mp_preapproval_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${mpToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auto_recurring: {
              transaction_amount: newPrice,
              currency_id: 'BRL',
            },
            external_reference: JSON.stringify({
              restaurant_id: restaurant.id,
              user_id: user.id,
              plan_slug: newPlan,
            }),
          }),
        }
      )

      if (!updateRes.ok) {
        const err = await updateRes.text()
        console.error('MP preapproval update failed:', err)
        return NextResponse.json(
          { error: 'Falha ao atualizar assinatura no Mercado Pago. Tente novamente.' },
          { status: 502, headers: rateLimit.headers }
        )
      }

      // Atualizar banco local
      await admin
        .from('subscriptions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', subscription.id)

      await admin.from('restaurants').update({ plan_slug: newPlan }).eq('id', restaurant.id)

      // Log de mudança de plano
      await admin.from('admin_actions').insert({
        user_id: user.id,
        action: 'plan_change',
        target_type: 'restaurant',
        target_id: restaurant.id,
        metadata: {
          from_plan: currentPlan,
          to_plan: newPlan,
          direction: isUpgrade ? 'upgrade' : 'downgrade',
          method: 'self_service',
          mp_preapproval_id: subscription.mp_preapproval_id,
        },
      })

      return NextResponse.json(
        {
          success: true,
          plan_slug: newPlan,
          direction: isUpgrade ? 'upgrade' : 'downgrade',
          message: isUpgrade
            ? `Upgrade para ${newPlan} realizado! O novo valor será cobrado no próximo ciclo.`
            : `Downgrade para ${newPlan} realizado. O novo valor será cobrado no próximo ciclo.`,
        },
        { headers: rateLimit.headers }
      )
    } catch (err) {
      console.error('Plan change error:', err)
      return NextResponse.json(
        { error: 'Erro ao processar mudança de plano' },
        { status: 500, headers: rateLimit.headers }
      )
    }
  }

  // Se não tem assinatura no MP (provisionamento manual, etc.), criar nova preapproval
  try {
    const newPrice =
      PUBLIC_SUBSCRIPTION_PRICES[newPlan as keyof typeof PUBLIC_SUBSCRIPTION_PRICES].monthly

    const preapproval = await preApproval.create({
      body: {
        payer_email: user.email!,
        reason: `${PRODUCT_NAME} — Plano ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}`,
        external_reference: JSON.stringify({
          restaurant_id: restaurant.id,
          user_id: user.id,
          plan_slug: newPlan,
        }),
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: newPrice,
          currency_id: 'BRL',
        },
        back_url: `${siteUrl}/painel/planos?upgrade=success`,
        status: 'pending',
      },
    })

    if (!preapproval.init_point) {
      return NextResponse.json(
        { error: 'Mercado Pago não retornou link de assinatura' },
        { status: 502, headers: rateLimit.headers }
      )
    }

    // Atualizar plano local imediatamente (webhook confirmará o pagamento)
    await admin.from('restaurants').update({ plan_slug: newPlan }).eq('id', restaurant.id)

    // Criar/atualizar registro de subscription
    await admin.from('subscriptions').upsert(
      {
        restaurant_id: restaurant.id,
        user_id: user.id,
        mp_preapproval_id: preapproval.id,
        status: 'pending',
        mp_subscription_status: 'pending',
      },
      { onConflict: 'restaurant_id' }
    )

    await admin.from('admin_actions').insert({
      user_id: user.id,
      action: 'plan_change',
      target_type: 'restaurant',
      target_id: restaurant.id,
      metadata: {
        from_plan: currentPlan,
        to_plan: newPlan,
        direction: isUpgrade ? 'upgrade' : 'downgrade',
        method: 'self_service_new_subscription',
      },
    })

    return NextResponse.json(
      {
        success: true,
        plan_slug: newPlan,
        direction: isUpgrade ? 'upgrade' : 'downgrade',
        init_point: preapproval.init_point,
        sandbox_init_point: (preapproval as any).sandbox_init_point,
        message: 'Redirecionando para pagamento da nova assinatura...',
      },
      { headers: rateLimit.headers }
    )
  } catch (err) {
    console.error('New subscription creation error:', err)
    return NextResponse.json(
      { error: 'Erro ao criar nova assinatura' },
      { status: 500, headers: rateLimit.headers }
    )
  }
}

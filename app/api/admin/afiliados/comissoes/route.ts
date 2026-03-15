/**
 * Admin API — Gerenciamento de comissões de afiliados
 *
 * GET  /api/admin/afiliados/comissoes
 *   → lista afiliados com saldo aprovado pendente de pagamento
 *
 * POST /api/admin/afiliados/comissoes
 *   → marca comissões de um afiliado como pagas e registra pagamento
 *   Body: { affiliate_id, valor, referencia_mes?, observacao? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

// Verifica se o usuário autenticado é admin
async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!authHeader) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${authHeader}` } } }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) return null
  return user
}

// ── GET — lista saldos ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('affiliate_balances')
    .select('*')
    .gt('saldo_aprovado', 0)
    .order('saldo_aprovado', { ascending: false })

  if (error) {
    console.error('Erro ao buscar saldos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  return NextResponse.json({ balances: data ?? [] })
}

// ── POST — registrar pagamento ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { affiliate_id, valor, referencia_mes, observacao, bonus_id, bonus_marco } = body

  if (!affiliate_id || !valor || Number(valor) <= 0) {
    return NextResponse.json({ error: 'affiliate_id e valor são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Busca afiliado para obter chave PIX
  const { data: affiliateData, error: affErr } = await admin
    .from('affiliates')
    .select('id, nome, chave_pix, status')
    .eq('id', affiliate_id)
    .single()

  if (affErr || !affiliateData) {
    return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
  }

  // ── Bônus de marco: verificar e sacar do bonus_fund ───────────────────────
  // Se bonus_id está presente, este pagamento é um bônus de marco.
  // Tenta sacar do fundo; se insuficiente, paga do caixa operacional (log de aviso).
  let fundoSuficiente = false
  if (bonus_id) {
    try {
      const { data: fundo } = await admin
        .from('bonus_fund_saldo')
        .select('saldo_atual')
        .single()
      const saldoFundo = Number(fundo?.saldo_atual ?? 0)
      const bonusValor = Number(valor)
      fundoSuficiente = saldoFundo >= bonusValor

      if (!fundoSuficiente) {
        console.warn(
          `⚠️ Fundo insuficiente (saldo R$${saldoFundo.toFixed(2)}) — bônus R$${bonusValor.toFixed(2)} pago do caixa operacional`
        )
      } else {
        await admin.from('bonus_fund').insert({
          tipo: 'bonus',
          valor: bonusValor,
          affiliate_id,
          descricao: `Bônus marco ${bonus_marco ?? '?'} restaurantes — ${affiliateData.nome}`,
        })
      }
    } catch (fundErr) {
      console.error('[comissoes] Erro ao sacar do bonus_fund (não bloqueante):', fundErr)
    }
  }

  // 2. Registra o pagamento
  const { data: payment, error: payErr } = await admin
    .from('affiliate_commission_payments')
    .insert({
      affiliate_id,
      valor: Number(valor),
      referencia_mes: referencia_mes ?? new Date().toISOString().slice(0, 7),
      metodo: 'pix',
      chave_pix_usada: affiliateData.chave_pix ?? null,
      observacao: observacao ?? null,
      pago_por: user.id,
    })
    .select()
    .single()

  if (payErr || !payment) {
    console.error('Erro ao registrar pagamento:', payErr)
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }

  // 3. FIFO: busca comissões aprovadas ordenadas por data de criação (mais antigas primeiro)
  const [vendorRefs, liderRefs] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('id, comissao')
      .eq('affiliate_id', affiliate_id)
      .eq('status', 'aprovado')
      .not('comissao', 'is', null)
      .order('created_at', { ascending: true }),
    admin
      .from('affiliate_referrals')
      .select('id, lider_comissao')
      .eq('lider_id', affiliate_id)
      .eq('lider_status', 'aprovado')
      .not('lider_comissao', 'is', null)
      .order('created_at', { ascending: true }),
  ])

  // Acumula FIFO: marca apenas as comissões que cabem no valor pago
  let saldoRestante = Number(valor)
  const idsVendedorPagar: string[] = []
  for (const ref of vendorRefs.data ?? []) {
    const comissao = Number(ref.comissao ?? 0)
    if (comissao > 0 && comissao <= saldoRestante) {
      idsVendedorPagar.push(ref.id)
      saldoRestante -= comissao
    }
  }

  const idsLiderPagar: string[] = []
  for (const ref of liderRefs.data ?? []) {
    const comissao = Number(ref.lider_comissao ?? 0)
    if (comissao > 0 && comissao <= saldoRestante) {
      idsLiderPagar.push(ref.id)
      saldoRestante -= comissao
    }
  }

  // Atualiza apenas IDs selecionados (não marca todas)
  if (idsVendedorPagar.length > 0) {
    await admin.from('affiliate_referrals').update({ status: 'pago' }).in('id', idsVendedorPagar)
  }
  if (idsLiderPagar.length > 0) {
    await admin
      .from('affiliate_referrals')
      .update({ lider_status: 'pago' })
      .in('id', idsLiderPagar)
  }

  const valorPagoReal = Number(valor) - saldoRestante
  const pagas = idsVendedorPagar.length + idsLiderPagar.length

  // Se era pagamento de bônus de marco, marca o registro como pago
  if (bonus_id) {
    try {
      await admin
        .from('affiliate_bonuses')
        .update({ status: 'pago', referencia_mes: referencia_mes ?? new Date().toISOString().slice(0, 7) })
        .eq('id', bonus_id)
    } catch (bonusErr) {
      console.warn('[comissoes] Aviso: falha ao marcar bonus como pago:', bonusErr)
    }
  }

  return NextResponse.json({
    success: true,
    payment_id: payment.id,
    affiliate: affiliateData.nome,
    valor_pago: valorPagoReal,
    chave_pix: affiliateData.chave_pix,
    pagas,
    saldo_restante: parseFloat(saldoRestante.toFixed(2)),
    ...(bonus_id ? { fundo_suficiente: fundoSuficiente } : {}),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resgatarRecompensaSchema } from '@/lib/schemas/fidelidade'
import { formatCurrency } from '@/lib/format-currency'
import type { ResgatarRecompensaResponse } from '@/types/fidelidade'

// POST /api/fidelidade/resgatar — Resgatar recompensa de fidelidade
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = resgatarRecompensaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { restaurante_id, cliente_email, pedido_id } = parsed.data
  const adminClient = createAdminClient()

  // Buscar configuração do programa
  const { data: config, error: configError } = await adminClient
    .from('fidelidade_config')
    .select('*')
    .eq('restaurante_id', restaurante_id)
    .eq('ativo', true)
    .single()

  if (configError || !config) {
    return NextResponse.json(
      { erro: 'Programa de fidelidade não encontrado ou inativo' },
      { status: 404 }
    )
  }

  // Buscar saldo do cliente
  const { data: saldo, error: saldoError } = await adminClient
    .from('fidelidade_cliente')
    .select('*')
    .eq('restaurante_id', restaurante_id)
    .eq('cliente_email', cliente_email)
    .single()

  if (saldoError || !saldo) {
    return NextResponse.json(
      { erro: 'Cliente não encontrado no programa de fidelidade' },
      { status: 404 }
    )
  }

  const comprasNecessarias = config.compras_para_recompensa as number
  const cicloAtual = saldo.compras_ciclo as number

  if (cicloAtual < comprasNecessarias) {
    const faltam = comprasNecessarias - cicloAtual
    return NextResponse.json<ResgatarRecompensaResponse>({
      sucesso: false,
      mensagem: `Você precisa de mais ${faltam} compra(s) para resgatar a recompensa`,
      desconto: 0,
      pontos_usados: 0,
      saldo_anterior: saldo.pontos_saldo as number,
      saldo_atual: saldo.pontos_saldo as number,
    })
  }

  const desconto = config.recompensa_valor as number
  const saldoAnterior = saldo.pontos_saldo as number

  // Zerar ciclo e registrar resgate
  const { error: updateError } = await adminClient
    .from('fidelidade_cliente')
    .update({ compras_ciclo: 0 })
    .eq('restaurante_id', restaurante_id)
    .eq('cliente_email', cliente_email)

  if (updateError) {
    return NextResponse.json({ erro: 'Erro ao processar resgate' }, { status: 500 })
  }

  // Registrar transação
  await adminClient.from('fidelidade_transacoes').insert({
    restaurante_id,
    cliente_email,
    tipo: 'resgate',
    pontos: 0,
    compras: -cicloAtual,
    pedido_id: pedido_id ?? null,
    descricao: `Recompensa resgatada: ${formatCurrency(desconto)}`,
  })

  return NextResponse.json<ResgatarRecompensaResponse>({
    sucesso: true,
    mensagem: `Recompensa resgatada! Desconto de ${formatCurrency(desconto)}`,
    desconto,
    pontos_usados: 0,
    saldo_anterior: saldoAnterior,
    saldo_atual: saldoAnterior,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCupomSchema } from '@/lib/schemas/cupom'
import type { ValidarCupomResponse } from '@/types/cupom'

// POST /api/cupons/validar — Valida cupom e calcula desconto
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = validarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { codigo, restaurante_id, valor_pedido } = parsed.data

  const adminClient = createAdminClient()

  const { data: cupom, error } = await adminClient
    .from('cupons')
    .select('id, codigo, tipo, valor, valor_minimo_pedido, max_usos, usos_atuais, data_expiracao, data_inicio')
    .eq('restaurante_id', restaurante_id)
    .eq('codigo', codigo)
    .eq('ativo', true)
    .single()

  if (error || !cupom) {
    const response: ValidarCupomResponse = {
      valido: false,
      desconto: 0,
      mensagem: 'Cupom não encontrado ou inválido',
    }
    return NextResponse.json(response)
  }

  const agora = new Date()

  // Verificar início
  if (cupom.data_inicio && new Date(cupom.data_inicio) > agora) {
    return NextResponse.json<ValidarCupomResponse>({
      valido: false,
      desconto: 0,
      mensagem: 'Este cupom ainda não está ativo',
    })
  }

  // Verificar expiração
  if (cupom.data_expiracao && new Date(cupom.data_expiracao) < agora) {
    return NextResponse.json<ValidarCupomResponse>({
      valido: false,
      desconto: 0,
      mensagem: 'Cupom expirado',
    })
  }

  // Verificar limite de usos
  if (cupom.max_usos !== null && cupom.usos_atuais >= cupom.max_usos) {
    return NextResponse.json<ValidarCupomResponse>({
      valido: false,
      desconto: 0,
      mensagem: 'Cupom esgotado',
    })
  }

  // Verificar valor mínimo
  const valorMinimo = Number(cupom.valor_minimo_pedido ?? 0)
  if (valor_pedido < valorMinimo) {
    return NextResponse.json<ValidarCupomResponse>({
      valido: false,
      desconto: 0,
      mensagem: `Valor mínimo para usar este cupom: R$ ${valorMinimo.toFixed(2)}`,
    })
  }

  // Calcular desconto
  let desconto: number
  if (cupom.tipo === 'percentual') {
    const pct = Number(cupom.valor) / 100
    desconto = Math.round(valor_pedido * pct * 100) / 100
  } else {
    desconto = Number(cupom.valor)
  }
  desconto = Math.min(desconto, valor_pedido)

  const response: ValidarCupomResponse = {
    valido: true,
    desconto,
    mensagem: `Cupom aplicado! Desconto de R$ ${desconto.toFixed(2)}`,
    cupom: {
      id: cupom.id,
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: Number(cupom.valor),
    },
  }

  return NextResponse.json(response)
}

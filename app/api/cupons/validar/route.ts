import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarCupomSchema } from '@/lib/schemas/cupom'
import type { ValidarCupomResponse, TipoCupom } from '@/types/cupom'

function calcularDesconto(tipo: TipoCupom, valor: number, valorPedido: number): number {
  if (tipo === 'percentual') {
    return parseFloat(((valorPedido * valor) / 100).toFixed(2))
  }
  return parseFloat(Math.min(valor, valorPedido).toFixed(2))
}

/**
 * POST /api/cupons/validar
 * Valida um cupom por código para um restaurante e valor de pedido.
 * Retorna o desconto calculado se válido.
 */
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = validarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { codigo, restaurante_id, valor_pedido } = parsed.data

  const { data: cupom, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('codigo', codigo.toUpperCase().trim())
    .eq('restaurante_id', restaurante_id)
    .eq('ativo', true)
    .single()

  if (error || !cupom) {
    const resp: ValidarCupomResponse = { valido: false, erro: 'Cupom não encontrado ou inválido' }
    return NextResponse.json(resp, { status: 200 })
  }

  const agora = new Date()

  if (new Date(cupom.data_inicio) > agora) {
    const resp: ValidarCupomResponse = { valido: false, erro: 'Cupom ainda não está vigente' }
    return NextResponse.json(resp)
  }

  if (cupom.data_expiracao && new Date(cupom.data_expiracao) < agora) {
    const resp: ValidarCupomResponse = { valido: false, erro: 'Cupom expirado' }
    return NextResponse.json(resp)
  }

  if (cupom.max_usos !== null && cupom.usos_atuais >= cupom.max_usos) {
    const resp: ValidarCupomResponse = { valido: false, erro: 'Cupom esgotado' }
    return NextResponse.json(resp)
  }

  if (cupom.valor_minimo_pedido !== null && valor_pedido < Number(cupom.valor_minimo_pedido)) {
    const resp: ValidarCupomResponse = {
      valido: false,
      erro: `Valor mínimo de R$ ${Number(cupom.valor_minimo_pedido).toFixed(2)} para usar este cupom`,
    }
    return NextResponse.json(resp)
  }

  let valorDesconto: number
  valorDesconto = calcularDesconto(cupom.tipo, Number(cupom.valor), valor_pedido)

  const resp: ValidarCupomResponse = {
    valido: true,
    cupom_id: cupom.id,
    codigo: cupom.codigo,
    tipo: cupom.tipo,
    valor_desconto: valorDesconto,
  }
  return NextResponse.json(resp)
}

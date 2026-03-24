import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { consultarSaldoSchema } from '@/lib/schemas/fidelidade'
import type { FidelidadeCliente, FidelidadeTransacao } from '@/types/fidelidade'

// GET /api/fidelidade/saldo — Consultar saldo do cliente
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawInput = {
    restaurante_id: searchParams.get('restaurante_id') ?? '',
    cliente_email: searchParams.get('cliente_email') ?? '',
  }

  const parsed = consultarSaldoSchema.safeParse(rawInput)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { restaurante_id, cliente_email } = parsed.data
  const adminClient = createAdminClient()

  const { data: saldo, error: saldoError } = await adminClient
    .from('fidelidade_cliente')
    .select('*')
    .eq('restaurante_id', restaurante_id)
    .eq('cliente_email', cliente_email)
    .single()

  if (saldoError && saldoError.code !== 'PGRST116') {
    return NextResponse.json({ erro: 'Erro ao consultar saldo' }, { status: 500 })
  }

  const { data: transacoes } = await adminClient
    .from('fidelidade_transacoes')
    .select('*')
    .eq('restaurante_id', restaurante_id)
    .eq('cliente_email', cliente_email)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    saldo: (saldo as FidelidadeCliente | null) ?? null,
    transacoes: (transacoes as FidelidadeTransacao[]) ?? [],
  })
}

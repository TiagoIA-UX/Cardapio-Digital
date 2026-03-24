import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarCupomSchema } from '@/lib/schemas/cupom'
import type { Cupom } from '@/types/cupom'

// GET /api/cupons — Listar cupons do restaurante autenticado
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const restauranteId = searchParams.get('restaurante_id')

  if (!restauranteId) {
    return NextResponse.json({ erro: 'restaurante_id obrigatório' }, { status: 400 })
  }

  // Verificar que o usuário é dono do restaurante
  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restauranteId)
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    return NextResponse.json({ erro: 'Restaurante não encontrado ou sem permissão' }, { status: 403 })
  }

  const { data: cupons, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ erro: 'Erro ao buscar cupons' }, { status: 500 })
  }

  return NextResponse.json({ cupons: cupons as Cupom[] })
}

// POST /api/cupons — Criar novo cupom
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = criarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const input = parsed.data

  // Verificar que o usuário é dono do restaurante
  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', input.restaurante_id)
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    return NextResponse.json({ erro: 'Restaurante não encontrado ou sem permissão' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { data: cupom, error } = await adminClient
    .from('cupons')
    .insert({
      restaurante_id: input.restaurante_id,
      codigo: input.codigo,
      tipo: input.tipo,
      valor: input.valor,
      valor_minimo_pedido: input.valor_minimo_pedido ?? 0,
      max_usos: input.max_usos ?? null,
      data_inicio: input.data_inicio ?? new Date().toISOString(),
      data_expiracao: input.data_expiracao ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ erro: 'Código já existe para este restaurante' }, { status: 409 })
    }
    return NextResponse.json({ erro: 'Erro ao criar cupom' }, { status: 500 })
  }

  return NextResponse.json({ cupom: cupom as Cupom }, { status: 201 })
}

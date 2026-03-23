import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { criarCupomSchema } from '@/lib/schemas/cupom'

/**
 * GET /api/cupons
 * Lista cupons do restaurante do operador autenticado.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (restError || !restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const { data: cupons, error } = await supabase
    .from('cupons')
    .select('*')
    .eq('restaurante_id', restaurant.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 })
  }

  return NextResponse.json({ cupons })
}

/**
 * POST /api/cupons
 * Cria um novo cupom para o restaurante do operador autenticado.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (restError || !restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = criarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const {
    codigo,
    tipo,
    valor,
    valor_minimo_pedido,
    max_usos,
    ativo,
    data_inicio,
    data_expiracao,
  } = parsed.data

  const { data: cupom, error } = await supabase
    .from('cupons')
    .insert({
      restaurante_id: restaurant.id,
      codigo,
      tipo,
      valor,
      valor_minimo_pedido: valor_minimo_pedido ?? null,
      max_usos: max_usos ?? null,
      ativo: ativo ?? true,
      data_inicio: data_inicio ?? new Date().toISOString(),
      data_expiracao: data_expiracao ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um cupom com este código para seu restaurante' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }

  return NextResponse.json({ cupom }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarAvaliacaoSchema } from '@/lib/schemas/avaliacao'
import type { Avaliacao } from '@/types/avaliacao'

// GET /api/avaliacoes — Listar avaliações de um restaurante
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restauranteId = searchParams.get('restaurante_id')

  if (!restauranteId) {
    return NextResponse.json({ erro: 'restaurante_id obrigatório' }, { status: 400 })
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '10', 10)))
  const offset = (page - 1) * perPage

  const supabase = await createClient()
  const { data: avaliacoes, error, count } = await supabase
    .from('avaliacoes')
    .select('*', { count: 'exact' })
    .eq('restaurante_id', restauranteId)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) {
    return NextResponse.json({ erro: 'Erro ao buscar avaliações' }, { status: 500 })
  }

  return NextResponse.json({
    avaliacoes: avaliacoes as Avaliacao[],
    total: count ?? 0,
    page,
    per_page: perPage,
  })
}

// POST /api/avaliacoes — Criar nova avaliação
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = criarAvaliacaoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const input = parsed.data
  const adminClient = createAdminClient()

  const { data: avaliacao, error } = await adminClient
    .from('avaliacoes')
    .insert({
      restaurante_id: input.restaurante_id,
      pedido_id: input.pedido_id ?? null,
      cliente_nome: input.cliente_nome,
      cliente_email: input.cliente_email ?? null,
      nota: input.nota,
      comentario: input.comentario ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: 'Erro ao criar avaliação' }, { status: 500 })
  }

  return NextResponse.json({ avaliacao: avaliacao as Avaliacao }, { status: 201 })
}

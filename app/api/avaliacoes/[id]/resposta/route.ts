import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { responderAvaliacaoSchema } from '@/lib/schemas/avaliacao'
import type { Avaliacao } from '@/types/avaliacao'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/avaliacoes/[id]/resposta — Operador responde a uma avaliação
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

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

  const parsed = responderAvaliacaoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Verificar que a avaliação pertence ao restaurante do usuário
  const { data: avaliacao } = await supabase
    .from('avaliacoes')
    .select('id, restaurante_id')
    .eq('id', id)
    .single()

  if (!avaliacao) {
    return NextResponse.json({ erro: 'Avaliação não encontrada' }, { status: 404 })
  }

  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', avaliacao.restaurante_id)
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    return NextResponse.json({ erro: 'Sem permissão para responder esta avaliação' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { data: avaliacaoAtualizada, error } = await adminClient
    .from('avaliacoes')
    .update({
      resposta: parsed.data.resposta,
      respondido_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: 'Erro ao salvar resposta' }, { status: 500 })
  }

  return NextResponse.json({ avaliacao: avaliacaoAtualizada as Avaliacao })
}

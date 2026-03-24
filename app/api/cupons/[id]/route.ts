import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { atualizarCupomSchema } from '@/lib/schemas/cupom'
import type { Cupom } from '@/types/cupom'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/cupons/[id] — Atualizar cupom
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const parsed = atualizarCupomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Verificar que o cupom pertence ao restaurante do usuário autenticado
  const { data: cupomExistente } = await supabase
    .from('cupons')
    .select('id, restaurante_id')
    .eq('id', id)
    .single()

  if (!cupomExistente) {
    return NextResponse.json({ erro: 'Cupom não encontrado' }, { status: 404 })
  }

  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', cupomExistente.restaurante_id)
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    return NextResponse.json({ erro: 'Sem permissão para este cupom' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { data: cupomAtualizado, error } = await adminClient
    .from('cupons')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: 'Erro ao atualizar cupom' }, { status: 500 })
  }

  return NextResponse.json({ cupom: cupomAtualizado as Cupom })
}

// DELETE /api/cupons/[id] — Desativar (soft delete) cupom
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
  }

  // Verificar que o cupom pertence ao restaurante do usuário autenticado
  const { data: cupomExistente } = await supabase
    .from('cupons')
    .select('id, restaurante_id')
    .eq('id', id)
    .single()

  if (!cupomExistente) {
    return NextResponse.json({ erro: 'Cupom não encontrado' }, { status: 404 })
  }

  const { data: restaurante } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', cupomExistente.restaurante_id)
    .eq('user_id', user.id)
    .single()

  if (!restaurante) {
    return NextResponse.json({ erro: 'Sem permissão para este cupom' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('cupons').update({ ativo: false }).eq('id', id)

  if (error) {
    return NextResponse.json({ erro: 'Erro ao desativar cupom' }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true, mensagem: 'Cupom desativado' })
}

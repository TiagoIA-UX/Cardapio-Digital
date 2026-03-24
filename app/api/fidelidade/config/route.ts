import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarFidelidadeConfigSchema, atualizarFidelidadeConfigSchema } from '@/lib/schemas/fidelidade'
import type { FidelidadeConfig } from '@/types/fidelidade'

// GET /api/fidelidade/config — Obter config de fidelidade do restaurante
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restauranteId = searchParams.get('restaurante_id')

  if (!restauranteId) {
    return NextResponse.json({ erro: 'restaurante_id obrigatório' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: config, error } = await supabase
    .from('fidelidade_config')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ erro: 'Erro ao buscar configuração' }, { status: 500 })
  }

  return NextResponse.json({ config: (config as FidelidadeConfig | null) ?? null })
}

// POST /api/fidelidade/config — Criar ou atualizar config de fidelidade
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

  const parsed = criarFidelidadeConfigSchema.safeParse(body)
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
  const { data: config, error } = await adminClient
    .from('fidelidade_config')
    .upsert(input, { onConflict: 'restaurante_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: 'Erro ao salvar configuração' }, { status: 500 })
  }

  return NextResponse.json({ config: config as FidelidadeConfig }, { status: 201 })
}

// PATCH /api/fidelidade/config — Atualizar config existente
export async function PATCH(request: NextRequest) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const parsed = atualizarFidelidadeConfigSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
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

  const adminClient = createAdminClient()
  const { data: config, error } = await adminClient
    .from('fidelidade_config')
    .update(parsed.data)
    .eq('restaurante_id', restauranteId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: 'Erro ao atualizar configuração' }, { status: 500 })
  }

  return NextResponse.json({ config: config as FidelidadeConfig })
}

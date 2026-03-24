import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const zoneSchema = z.object({
  nome: z.string().min(1).max(60),
  bairros: z.array(z.string().min(1)).min(1),
  taxa: z.number().min(0),
  ativo: z.boolean().default(true),
})

async function getRestaurantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rest } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return rest?.id ?? null
}

// GET /api/delivery-zones — lista zonas do restaurante
// Aceita também ?restaurant_id=... para consulta pública (checkout)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const publicRestaurantId = searchParams.get('restaurant_id')

  const admin = createAdminClient()

  if (publicRestaurantId) {
    // Consulta pública: apenas retorna zonas ativas para o checkout calcular a taxa
    const { data, error } = await admin
      .from('delivery_zones')
      .select('id, nome, bairros, taxa')
      .eq('restaurant_id', publicRestaurantId)
      .eq('ativo', true)
      .order('taxa', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar zonas' }, { status: 500 })
    }
    return NextResponse.json({ zones: data })
  }

  // Requisição autenticada (painel admin)
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await admin
    .from('delivery_zones')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('nome', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar zonas' }, { status: 500 })
  }

  return NextResponse.json({ zones: data })
}

// POST /api/delivery-zones — cria nova zona
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const result = zoneSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('delivery_zones')
    .insert({ ...result.data, restaurant_id: restaurantId })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao criar zona' }, { status: 500 })
  }

  return NextResponse.json({ zone: data }, { status: 201 })
}

// PATCH /api/delivery-zones?id=... — atualiza zona
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const body = await request.json()
  const result = zoneSchema.partial().safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('delivery_zones')
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Zona não encontrada ou erro ao atualizar' }, { status: 404 })
  }

  return NextResponse.json({ zone: data })
}

// DELETE /api/delivery-zones?id=... — remove zona
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const restaurantId = await getRestaurantId(supabase)
  if (!restaurantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('delivery_zones')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurantId)

  if (error) {
    return NextResponse.json({ error: 'Erro ao deletar zona' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

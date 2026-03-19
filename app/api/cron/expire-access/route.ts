import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = process.env.CRON_SECRET

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    // 1. Revogar acessos expirados via RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc('expire_freelancer_access')

    if (rpcError) {
      console.error('Erro ao expirar acessos:', rpcError)
    }

    // 2. Também fazer manualmente para garantia
    const { data: expired, error: manualError } = await supabase
      .from('freelancer_access')
      .update({ revoked_at: new Date().toISOString() })
      .is('revoked_at', null)
      .lt('expires_at', new Date().toISOString())
      .select('id')

    const revokedCount = expired?.length ?? 0

    // Log da execução
    await supabase.from('system_logs').insert({
      entity: 'cron',
      entity_id: null,
      action: 'expire_access',
      actor_type: 'system',
      metadata: {
        rpc_result: rpcResult ?? null,
        manual_revoked: revokedCount,
        checked_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      revoked: revokedCount,
      checked_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro no cron expire-access:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { getRequestSiteUrl } from '@/lib/site-url'
import { NextResponse } from 'next/server'

function getSafeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/painel'
  }

  if (next.includes('\r') || next.includes('\n')) {
    return '/painel'
  }

  if (next.startsWith('/api') || next.startsWith('/auth/callback') || next.startsWith('/_next')) {
    return '/painel'
  }

  return next
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const siteUrl = getRequestSiteUrl(request)
  const next = getSafeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, siteUrl))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', siteUrl))
}

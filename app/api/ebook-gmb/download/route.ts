import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { createMercadoPagoPaymentClient } from '@/lib/domains/core/mercadopago'
import { createClient } from '@/lib/shared/supabase/server'

const FILE_NAME = 'google-meu-negocio-guia-completo.pdf'
const FILE_PATH = path.join(process.cwd(), 'private', 'ebooks', FILE_NAME)

async function serveEbook() {
  const content = await readFile(FILE_PATH)
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Google-Meu-Negocio-Guia-Completo-Zairyx.pdf"',
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return serveEbook()
  }

  const paymentId =
    request.nextUrl.searchParams.get('payment_id') ||
    request.nextUrl.searchParams.get('collection_id')

  if (!paymentId) {
    return NextResponse.json({ error: 'Unauthorized download' }, { status: 401 })
  }

  try {
    const paymentClient = createMercadoPagoPaymentClient(10_000)
    const payment = await paymentClient.get({ id: paymentId })

    const status = String(payment.status || '').toLowerCase()
    const externalReference = String(payment.external_reference || '')

    if (!['approved', 'accredited'].includes(status)) {
      return NextResponse.json({ error: 'Payment not approved' }, { status: 403 })
    }

    if (!externalReference.startsWith('ebook_gmb:')) {
      return NextResponse.json({ error: 'Invalid payment reference' }, { status: 403 })
    }

    return serveEbook()
  } catch (error) {
    console.error('[ebook-gmb-download] payment validation error:', error)
    return NextResponse.json({ error: 'Could not validate payment' }, { status: 502 })
  }
}

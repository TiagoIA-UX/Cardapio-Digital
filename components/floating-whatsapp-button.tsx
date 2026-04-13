'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '5512996887993'
const WHATSAPP_TEXT =
  'Olá! Tenho uma dúvida, proposta ou pedido comercial sobre a Zairyx e gostaria de falar com você.'

const HIDDEN_PREFIXES = ['/admin', '/painel', '/r/']

export function FloatingWhatsAppButton() {
  const pathname = usePathname()

  if (!pathname) {
    return null
  }

  const shouldHide = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (shouldHide) {
    return null
  }

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-4 z-70 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5 hover:bg-green-600 md:right-6 md:bottom-6"
    >
      <MessageCircle className="h-6 w-6" />
    </Link>
  )
}

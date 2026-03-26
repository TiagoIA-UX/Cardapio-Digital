'use client'

import { useABVariant } from '@/hooks/use-ab-variant'
import { trackEvent } from '@/lib/analytics'
import { useEffect } from 'react'

const VARIANTS = {
  A: {
    badge: 'Seu cliente já te conhece — por que pagar 15% ao iFood?',
    heading: (
      <>
        Cliente fiel pedindo pelo iFood?{' '}
        <span className="text-red-400">Você paga R$ 3.000/mês por isso.</span>
        <span className="mt-2 block text-orange-400">Mande pro SEU cardápio. Lucre 100%.</span>
      </>
    ),
  },
  B: {
    badge: 'Use o iFood pra pescar cliente novo. O fiel pede no SEU canal.',
    heading: (
      <>
        Pare de pagar <span className="text-red-400">15% de comissão</span> em quem já é seu cliente.
        <span className="mt-2 block text-orange-400">Seu cardápio. Sua marca. Seu lucro.</span>
      </>
    ),
  },
} as const

export function HeroBadge() {
  const variant = useABVariant()
  if (!variant) {
    return <span className="invisible">{VARIANTS.A.badge}</span>
  }
  return <>{VARIANTS[variant].badge}</>
}

export function HeroHeading() {
  const variant = useABVariant()

  useEffect(() => {
    if (variant) {
      trackEvent('cta_click', { cta: `hero_view_${variant}`, page: 'landing' })
    }
  }, [variant])

  if (!variant) {
    return <span className="invisible">{VARIANTS.A.heading}</span>
  }
  return <>{VARIANTS[variant].heading}</>
}

import {
  PLAN_LIMITS,
  PUBLIC_SUBSCRIPTION_PRICES,
  type SubscriptionPlanSlug,
} from '@/lib/domains/marketing/pricing'

export interface CatalogCapacityOption {
  slug: SubscriptionPlanSlug
  title: string
  description: string
  maxProducts: number
  monthlyPrice: number
}

export const CATALOG_CAPACITY_OPTIONS: CatalogCapacityOption[] = [
  {
    slug: 'semente',
    title: 'Comeco rapido',
    description: 'Operacao enxuta para iniciar canal digital com catalogo menor.',
    maxProducts: PLAN_LIMITS.semente.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.semente.monthly,
  },
  {
    slug: 'basico',
    title: 'Operacao local',
    description: 'Ideal para deliverys com cardapio completo e rotina diaria.',
    maxProducts: PLAN_LIMITS.basico.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.basico.monthly,
  },
  {
    slug: 'pro',
    title: 'Crescimento acelerado',
    description: 'Para expandir variedade, combos e sazonalidades.',
    maxProducts: PLAN_LIMITS.pro.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.pro.monthly,
  },
  {
    slug: 'premium',
    title: 'Catalogo de alto volume',
    description: 'Para operacoes com grande mix de produtos e alta escala.',
    maxProducts: PLAN_LIMITS.premium.maxProducts,
    monthlyPrice: PUBLIC_SUBSCRIPTION_PRICES.premium.monthly,
  },
]

export function getCatalogCapacityOption(slug: SubscriptionPlanSlug): CatalogCapacityOption {
  return (
    CATALOG_CAPACITY_OPTIONS.find((option) => option.slug === slug) || CATALOG_CAPACITY_OPTIONS[1]
  )
}

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ValidatedCoupon {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  /** Valor original: percentual (ex: 20) ou fixo (ex: 5.00) para recálculo no frontend */
  rawDiscountValue: number
}

export interface CouponValidationResult {
  valid: boolean
  coupon?: ValidatedCoupon
  error?: string
}

/** Cupons padrão para seed automático quando não existem no banco */
const DEFAULT_COUPONS = [
  {
    code: 'GANHEI20%',
    discount_type: 'percentage' as const,
    discount_value: 20,
    min_purchase: 0,
    max_uses: 10,
    expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    code: 'BEMVINDO10',
    discount_type: 'percentage' as const,
    discount_value: 10,
    min_purchase: 0,
    max_uses: 100,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
]

async function ensureCouponExists(
  supabase: SupabaseClient,
  normalizedCode: string
): Promise<boolean> {
  const match = DEFAULT_COUPONS.find((c) => c.code === normalizedCode)
  if (!match) return false

  try {
    await supabase
      .from('coupons')
      .upsert(
        {
          ...match,
          current_uses: 0,
        },
        { onConflict: 'code', ignoreDuplicates: true }
      )
    return true
  } catch {
    return false
  }
}

/**
 * Valida cupom no servidor. Usado por validar-cupom e iniciar-onboarding.
 * Se restaurant_id for fornecido, busca cupons desse restaurante primeiro;
 * se não encontrar, tenta cupons de plataforma (restaurant_id IS NULL).
 */
export async function validateCoupon(
  supabase: SupabaseClient,
  code: string,
  subtotal: number,
  restaurant_id?: string
): Promise<CouponValidationResult> {
  const normalizedCode = code.toUpperCase().trim()
  if (!normalizedCode || subtotal < 0) {
    return { valid: false, error: 'Código ou valor inválido' }
  }

  // Busca cupom do restaurante específico, ou cupom de plataforma
  let query = supabase
    .from('coupons')
    .select('*')
    .eq('code', normalizedCode)
    .eq('is_active', true)

  if (restaurant_id) {
    query = query.or(`restaurant_id.eq.${restaurant_id},restaurant_id.is.null`)
  }

  let { data: coupon, error } = await query
    .order('restaurant_id', { ascending: false, nullsFirst: false }) // preferir cupom do restaurante
    .limit(1)
    .maybeSingle()

  if ((error || !coupon) && (await ensureCouponExists(supabase, normalizedCode))) {
    const retry = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    coupon = retry.data
    error = retry.error
  }

  if (error || !coupon) {
    return { valid: false, error: 'Cupom não encontrado ou inválido' }
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: 'Cupom expirado' }
  }

  if (coupon.max_uses != null && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: 'Cupom esgotado' }
  }

  if (coupon.min_purchase != null && subtotal < Number(coupon.min_purchase)) {
    return {
      valid: false,
      error: `Valor mínimo de R$ ${Number(coupon.min_purchase).toFixed(2)} para usar este cupom`,
    }
  }

  let discountValue = Number(coupon.discount_value)
  if (coupon.discount_type === 'percentage') {
    discountValue = Math.round(subtotal * (discountValue / 100))
  }
  discountValue = Math.min(discountValue, subtotal)

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue,
      rawDiscountValue: Number(coupon.discount_value),
    },
  }
}

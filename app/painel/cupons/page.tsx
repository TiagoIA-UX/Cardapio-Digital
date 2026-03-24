'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2,
  Plus,
  Tag,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format-currency'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface FormState {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  min_purchase: string
  max_uses: string
  expires_at: string
}

function createEmptyForm(): FormState {
  return {
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '0',
    max_uses: '',
    expires_at: '',
  }
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(createEmptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const supabase = createClient()

  const loadCoupons = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/cupons')
    if (res.ok) {
      const data = (await res.json()) as { coupons: Coupon[] }
      setCoupons(data.coupons ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadCoupons()
  }, [loadCoupons])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)

    const discountValue = parseFloat(form.discount_value.replace(',', '.'))
    const minPurchase = parseFloat(form.min_purchase.replace(',', '.')) || 0
    const maxUses = form.max_uses ? parseInt(form.max_uses) : null

    if (isNaN(discountValue) || discountValue <= 0) {
      setFormError('Informe um valor de desconto válido')
      setSaving(false)
      return
    }

    if (form.discount_type === 'percentage' && discountValue > 100) {
      setFormError('Desconto percentual não pode ser maior que 100%')
      setSaving(false)
      return
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: discountValue,
      min_purchase: minPurchase,
      max_uses: maxUses,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: true,
    }

    const res = await fetch('/api/cupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = (await res.json()) as { coupon?: Coupon; error?: string }

    if (!res.ok) {
      setFormError(result.error ?? 'Erro ao criar cupom')
    } else {
      setCoupons((prev) => [result.coupon!, ...prev])
      setForm(createEmptyForm())
      setShowForm(false)
    }

    setSaving(false)
  }

  const toggleActive = async (coupon: Coupon) => {
    const res = await fetch(`/api/cupons?id=${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    })
    if (res.ok) {
      const { coupon: updated } = (await res.json()) as { coupon: Coupon }
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Excluir este cupom?')) return
    const res = await fetch(`/api/cupons?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground text-sm">
            Crie e gerencie cupons para seus clientes.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormError(null)
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo cupom
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card border-border mb-6 rounded-2xl border p-4 sm:p-6"
        >
          <h2 className="text-foreground mb-4 font-semibold">Criar novo cupom</h2>
          {formError && (
            <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Código do cupom *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: DESCONTO10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm uppercase focus:border-transparent focus:ring-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Tipo de desconto *
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })
                }
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              >
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Valor do desconto *
              </label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  {form.discount_type === 'percentage' ? '%' : 'R$'}
                </span>
                <input
                  type="text"
                  required
                  inputMode="decimal"
                  placeholder={form.discount_type === 'percentage' ? '10' : '5,00'}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border py-2 pr-3 pl-8 text-sm focus:border-transparent focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Compra mínima (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.min_purchase}
                onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Usos máximos
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ilimitado"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Válido até
              </label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar cupom
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setFormError(null)
              }}
              className="border-border hover:bg-muted rounded-xl border px-5 py-2 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <Tag className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <p className="text-foreground font-medium">Nenhum cupom cadastrado</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie seu primeiro cupom para oferecer descontos aos seus clientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isExpired = coupon.expires_at
              ? new Date(coupon.expires_at) < new Date()
              : false
            const isExhausted =
              coupon.max_uses != null && coupon.current_uses >= coupon.max_uses
            const effectivelyActive = coupon.is_active && !isExpired && !isExhausted

            return (
              <div
                key={coupon.id}
                className={`bg-card border-border flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-4 ${
                  !effectivelyActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      effectivelyActive ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    {coupon.discount_type === 'percentage' ? (
                      <Percent
                        className={`h-5 w-5 ${effectivelyActive ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    ) : (
                      <DollarSign
                        className={`h-5 w-5 ${effectivelyActive ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground font-mono font-bold">{coupon.code}</span>
                      {!coupon.is_active && (
                        <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                          Desativado
                        </span>
                      )}
                      {isExpired && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">
                          Expirado
                        </span>
                      )}
                      {isExhausted && (
                        <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                          Esgotado
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}% de desconto`
                        : `${formatCurrency(coupon.discount_value)} de desconto`}
                      {coupon.min_purchase > 0 &&
                        ` · mínimo ${formatCurrency(coupon.min_purchase)}`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {coupon.current_uses} uso{coupon.current_uses !== 1 ? 's' : ''}
                      {coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' (ilimitado)'}
                      {coupon.expires_at &&
                        ` · válido até ${new Date(coupon.expires_at).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void toggleActive(coupon)}
                    title={coupon.is_active ? 'Desativar cupom' : 'Ativar cupom'}
                    className="hover:bg-muted rounded-lg p-2 transition-colors"
                  >
                    {coupon.is_active ? (
                      <ToggleRight className="text-primary h-6 w-6" />
                    ) : (
                      <ToggleLeft className="text-muted-foreground h-6 w-6" />
                    )}
                  </button>
                  <button
                    onClick={() => void deleteCoupon(coupon.id)}
                    title="Excluir cupom"
                    className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg p-2 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

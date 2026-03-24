'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Star, Users, TrendingUp, Gift } from 'lucide-react'
import { formatCurrency } from '@/lib/format-currency'

interface LoyaltyConfig {
  id?: string
  ativo: boolean
  pontos_por_real: number
  real_por_ponto: number
  resgate_minimo: number
  validade_dias: number
}

interface LoyaltyAccount {
  id: string
  cliente_telefone: string
  cliente_nome: string | null
  pontos_total: number
  pontos_resgatados: number
  total_gasto: number
  total_pedidos: number
  ultimo_pedido_at: string | null
}

const DEFAULT_CONFIG: LoyaltyConfig = {
  ativo: true,
  pontos_por_real: 1,
  real_por_ponto: 0.1,
  resgate_minimo: 100,
  validade_dias: 365,
}

export default function FidelidadePage() {
  const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_CONFIG)
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/loyalty')
    if (res.ok) {
      const data = (await res.json()) as {
        config: LoyaltyConfig | null
        accounts: LoyaltyAccount[]
        total: number
      }
      if (data.config) setConfig(data.config)
      setAccounts(data.accounts ?? [])
      setTotal(data.total ?? 0)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (res.ok) {
      const data = (await res.json()) as { config: LoyaltyConfig }
      setConfig(data.config)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    }
    setSaving(false)
  }

  const totalPontos = accounts.reduce((sum, a) => sum + a.pontos_total, 0)
  const totalClientes = total

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
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-bold">Programa de Fidelidade</h1>
        <p className="text-muted-foreground text-sm">
          Recompense seus clientes fiéis com pontos a cada pedido.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Users, label: 'Clientes cadastrados', value: String(totalClientes) },
          { icon: Star, label: 'Pontos em circulação', value: String(totalPontos.toLocaleString('pt-BR')) },
          {
            icon: TrendingUp,
            label: 'Pontos por R$1',
            value: String(config.pontos_por_real),
          },
          {
            icon: Gift,
            label: 'Valor do ponto',
            value: formatCurrency(config.real_por_ponto),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border-border rounded-2xl border p-4">
            <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-xl">
              <Icon className="text-primary h-5 w-5" />
            </div>
            <p className="text-foreground text-xl font-bold">{value}</p>
            <p className="text-muted-foreground text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Config Form */}
        <div className="bg-card border-border rounded-2xl border p-4 sm:p-6">
          <h2 className="text-foreground mb-4 font-semibold">Configuração do Programa</h2>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            {/* Toggle ativo */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm font-medium">Programa ativo</p>
                <p className="text-muted-foreground text-xs">
                  Clientes acumulam pontos em pedidos feitos com número de telefone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, ativo: !config.ativo })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  config.ativo ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    config.ativo ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Pontos por R$1 gasto
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={config.pontos_por_real}
                onChange={(e) =>
                  setConfig({ ...config, pontos_por_real: parseFloat(e.target.value) || 1 })
                }
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Ex: 1 = cliente ganha 1 ponto por R$1 pedido
              </p>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Valor do ponto no resgate (R$)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={config.real_por_ponto}
                onChange={(e) =>
                  setConfig({ ...config, real_por_ponto: parseFloat(e.target.value) || 0.1 })
                }
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Ex: 0,10 = 100 pontos = R$10,00 de desconto
              </p>
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Mínimo de pontos para resgatar
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={config.resgate_minimo}
                onChange={(e) =>
                  setConfig({ ...config, resgate_minimo: parseInt(e.target.value) || 100 })
                }
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Validade dos pontos (dias)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={config.validade_dias}
                onChange={(e) =>
                  setConfig({ ...config, validade_dias: parseInt(e.target.value) || 365 })
                }
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">0 = sem validade</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saveSuccess ? '✓ Configurações salvas!' : 'Salvar configurações'}
            </button>
          </form>
        </div>

        {/* Clients Table */}
        <div className="bg-card border-border rounded-2xl border p-4 sm:p-6">
          <h2 className="text-foreground mb-4 font-semibold">
            Clientes ({totalClientes})
          </h2>

          {accounts.length === 0 ? (
            <div className="py-10 text-center">
              <Star className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                Nenhum cliente no programa ainda. Os pontos são creditados automaticamente quando um
                cliente faz um pedido informando o telefone.
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border border-b text-xs">
                    <th className="pb-2 text-left font-medium">Cliente</th>
                    <th className="pb-2 text-right font-medium">Pontos</th>
                    <th className="pb-2 text-right font-medium">Gasto</th>
                    <th className="pb-2 text-right font-medium">Pedidos</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="py-2">
                        <p className="text-foreground font-medium">
                          {account.cliente_nome ?? '—'}
                        </p>
                        <p className="text-muted-foreground text-xs">{account.cliente_telefone}</p>
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-primary font-bold">
                          {account.pontos_total.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {formatCurrency(account.total_gasto)}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {account.total_pedidos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

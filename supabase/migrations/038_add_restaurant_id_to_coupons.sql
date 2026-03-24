-- Migration 038: adiciona restaurant_id à tabela coupons para suporte multi-tenant
-- Cupons com restaurant_id = NULL são cupons de plataforma (ex: GANHEI20%)
-- Cupons com restaurant_id = <UUID> são cupons específicos de cada restaurante

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Índice para listar cupons por restaurante rapidamente
CREATE INDEX IF NOT EXISTS idx_coupons_restaurant_id ON coupons(restaurant_id);

-- RLS: restaurante só vê/gerencia seus próprios cupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler cupons de plataforma (restaurant_id IS NULL)
-- e os cupons do próprio restaurante (para validação no checkout)
DROP POLICY IF EXISTS "Cupons leitura pública" ON coupons;
CREATE POLICY "Cupons leitura pública" ON coupons
  FOR SELECT USING (
    restaurant_id IS NULL
    OR restaurant_id IN (
      SELECT id FROM restaurants WHERE ativo = true
    )
  );

-- Dono do restaurante pode gerenciar seus cupons
DROP POLICY IF EXISTS "Dono gerencia seus cupons" ON coupons;
CREATE POLICY "Dono gerencia seus cupons" ON coupons
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Função auxiliar para incrementar uso do cupom atomicamente
CREATE OR REPLACE FUNCTION increment_coupon_uses(p_coupon_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE coupons
    SET current_uses = current_uses + 1
  WHERE id = p_coupon_id;
$$;

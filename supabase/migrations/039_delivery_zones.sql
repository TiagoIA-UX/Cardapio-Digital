-- Migration 039: zonas de entrega por bairro/região com taxa específica
-- Permite que cada restaurante configure diferentes taxas por bairro

CREATE TABLE IF NOT EXISTS delivery_zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,          -- Nome da zona (ex: "Centro", "Zona Norte")
  bairros     TEXT[] NOT NULL DEFAULT '{}', -- Lista de bairros cobertos
  taxa        DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo       BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurant ON delivery_zones(restaurant_id);

-- RLS
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Leitura pública (para o cardápio consultar a taxa)
DROP POLICY IF EXISTS "Zonas leitura pública" ON delivery_zones;
CREATE POLICY "Zonas leitura pública" ON delivery_zones
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE ativo = true
    )
  );

-- Dono gerencia suas zonas
DROP POLICY IF EXISTS "Dono gerencia suas zonas" ON delivery_zones;
CREATE POLICY "Dono gerencia suas zonas" ON delivery_zones
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Adicionar taxa de entrega padrão à tabela restaurants (para o cardápio público)
-- Usado como fallback quando não há zona de entrega configurada para o bairro
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS taxa_entrega DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pedido_minimo DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aceita_entrega BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS aceita_retirada BOOLEAN DEFAULT TRUE;

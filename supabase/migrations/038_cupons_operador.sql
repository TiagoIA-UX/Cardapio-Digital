-- Migration: 038_cupons_operador.sql
-- Sistema de cupons de desconto por restaurante
-- Cada operador pode criar cupons para seus clientes.

-- Tipo enum para o desconto
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_cupom') THEN
    CREATE TYPE tipo_cupom AS ENUM ('percentual', 'valor_fixo');
  END IF;
END$$;

-- Tabela de cupons por restaurante
CREATE TABLE IF NOT EXISTS cupons (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id      UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  codigo              TEXT        NOT NULL,
  tipo                tipo_cupom  NOT NULL,
  valor               NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  valor_minimo_pedido NUMERIC(10, 2) NULL,
  max_usos            INTEGER     NULL, -- NULL = ilimitado
  usos_atuais         INTEGER     NOT NULL DEFAULT 0,
  ativo               BOOLEAN     NOT NULL DEFAULT TRUE,
  data_inicio         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_expiracao      TIMESTAMPTZ NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Código único por restaurante
  CONSTRAINT cupons_restaurante_codigo_unique UNIQUE (restaurante_id, codigo)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS cupons_restaurante_id_idx ON cupons (restaurante_id);
CREATE INDEX IF NOT EXISTS cupons_codigo_idx ON cupons (codigo);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_cupons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cupons_updated_at ON cupons;
CREATE TRIGGER trg_cupons_updated_at
  BEFORE UPDATE ON cupons
  FOR EACH ROW EXECUTE FUNCTION set_cupons_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;

-- Operador: acesso somente aos cupons do próprio restaurante
CREATE POLICY "cupons_operador_select"
  ON cupons FOR SELECT
  USING (
    restaurante_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cupons_operador_insert"
  ON cupons FOR INSERT
  WITH CHECK (
    restaurante_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cupons_operador_update"
  ON cupons FOR UPDATE
  USING (
    restaurante_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "cupons_operador_delete"
  ON cupons FOR DELETE
  USING (
    restaurante_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Admin: acesso irrestrito (service_role ignora RLS; esta policy cobre roles futuros)
CREATE POLICY "cupons_admin_all"
  ON cupons FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

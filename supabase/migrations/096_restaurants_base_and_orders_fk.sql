-- =====================================================
-- Migration 096: tabela base de restaurants + FK em orders
-- Extraído da 002 que foi editada indevidamente.
-- Garante idempotência com IF NOT EXISTS / IF NOT EXISTS.
-- =====================================================

CREATE TABLE IF NOT EXISTS restaurants (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT,
  slug       TEXT        UNIQUE,
  ativo      BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

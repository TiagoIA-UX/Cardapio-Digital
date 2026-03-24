-- Migration 040: sistema básico de fidelidade por pontos
-- Cada restaurante pode configurar suas próprias regras de pontos
-- Os pontos são acumulados por cliente (identificado pelo telefone)

-- Tabela de configuração do programa de fidelidade por restaurante
CREATE TABLE IF NOT EXISTS loyalty_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  ativo            BOOLEAN DEFAULT TRUE,
  pontos_por_real  DECIMAL(10,2) DEFAULT 1,    -- pontos ganhos por R$1 gasto
  real_por_ponto   DECIMAL(10,2) DEFAULT 0.10, -- valor em R$ de cada ponto ao resgatar
  resgate_minimo   INTEGER DEFAULT 100,         -- mínimo de pontos para resgatar
  validade_dias    INTEGER DEFAULT 365,         -- validade dos pontos em dias (0 = sem validade)
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_config_restaurant ON loyalty_config(restaurant_id);

-- Tabela de saldo de pontos por cliente (agregado para performance)
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  cliente_telefone TEXT NOT NULL,
  cliente_nome     TEXT,
  pontos_total     INTEGER DEFAULT 0,
  pontos_resgatados INTEGER DEFAULT 0,
  total_gasto      DECIMAL(10,2) DEFAULT 0,
  total_pedidos    INTEGER DEFAULT 0,
  ultimo_pedido_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, cliente_telefone)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_restaurant ON loyalty_accounts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_telefone ON loyalty_accounts(cliente_telefone);

-- Histórico de transações de pontos
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
  tipo             TEXT NOT NULL CHECK (tipo IN ('ganhou', 'resgatou', 'expirou', 'ajuste')),
  pontos           INTEGER NOT NULL,   -- positivo = ganhou, negativo = resgatou/expirou
  descricao        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_account ON loyalty_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_restaurant ON loyalty_transactions(restaurant_id);

-- RLS
ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- loyalty_config: dono gerencia, leitura pública
DROP POLICY IF EXISTS "Dono gerencia loyalty config" ON loyalty_config;
CREATE POLICY "Dono gerencia loyalty config" ON loyalty_config
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Leitura pública loyalty config" ON loyalty_config;
CREATE POLICY "Leitura pública loyalty config" ON loyalty_config
  FOR SELECT USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE ativo = true)
  );

-- loyalty_accounts: dono vê e gerencia
DROP POLICY IF EXISTS "Dono vê contas loyalty" ON loyalty_accounts;
CREATE POLICY "Dono vê contas loyalty" ON loyalty_accounts
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- loyalty_transactions: dono vê
DROP POLICY IF EXISTS "Dono vê transações loyalty" ON loyalty_transactions;
CREATE POLICY "Dono vê transações loyalty" ON loyalty_transactions
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

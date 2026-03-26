-- =====================================================================
-- 044 — Tabelas para IA Learning + Escalações + Expansão de Rede
-- =====================================================================

-- ─── ai_escalations ──────────────────────────────────────────────────
-- Registra escalações do chatbot IA para atendimento humano
CREATE TABLE IF NOT EXISTS ai_escalations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      TEXT NOT NULL,
  user_messages   JSONB DEFAULT '[]',
  ai_responses    JSONB DEFAULT '[]',
  escalation_reason TEXT NOT NULL,
  page_context    TEXT,
  user_type       TEXT NOT NULL CHECK (user_type IN ('admin', 'restaurant_owner', 'end_customer')),
  resolved        BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  category        TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_escalations_resolved ON ai_escalations(resolved);
CREATE INDEX idx_ai_escalations_category ON ai_escalations(category);
CREATE INDEX idx_ai_escalations_created_at ON ai_escalations(created_at DESC);

-- RLS: Somente admins podem ler/escrever escalações
ALTER TABLE ai_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_escalations_select_admin"
  ON ai_escalations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

-- Permitir insert público (o chatbot precisa salvar sem auth)
CREATE POLICY "ai_escalations_insert_public"
  ON ai_escalations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "ai_escalations_update_admin"
  ON ai_escalations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

-- ─── ai_learning_entries ─────────────────────────────────────────────
-- Entradas de aprendizado extraídas de escalações resolvidas
CREATE TABLE IF NOT EXISTS ai_learning_entries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escalation_id     UUID REFERENCES ai_escalations(id) ON DELETE CASCADE,
  question          TEXT NOT NULL,
  correct_answer    TEXT NOT NULL,
  category          TEXT,
  added_to_knowledge BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_learning_entries_category ON ai_learning_entries(category);
CREATE INDEX idx_ai_learning_entries_knowledge ON ai_learning_entries(added_to_knowledge);

ALTER TABLE ai_learning_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_learning_entries_select_admin"
  ON ai_learning_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

CREATE POLICY "ai_learning_entries_insert_admin"
  ON ai_learning_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

-- ─── network_expansion_orders ────────────────────────────────────────
-- Pedidos de expansão de rede (filiais)
CREATE TABLE IF NOT EXISTS network_expansion_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL,
  headquarters_id   UUID NOT NULL REFERENCES restaurants(id),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  units_requested   INTEGER NOT NULL CHECK (units_requested >= 1 AND units_requested <= 10),
  branch_configs    JSONB DEFAULT '[]',
  total_amount      NUMERIC(10,2) NOT NULL,
  discount_applied  NUMERIC(10,2) DEFAULT 0,
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('pix', 'card')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'failed')),
  mp_preference_id  TEXT,
  mp_payment_id     TEXT,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_network_expansion_orders_org ON network_expansion_orders(organization_id);
CREATE INDEX idx_network_expansion_orders_user ON network_expansion_orders(user_id);
CREATE INDEX idx_network_expansion_orders_status ON network_expansion_orders(status);

-- Trigger para updated_at
CREATE TRIGGER set_network_expansion_orders_updated_at
  BEFORE UPDATE ON network_expansion_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE network_expansion_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "network_expansion_orders_select_own"
  ON network_expansion_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "network_expansion_orders_insert_own"
  ON network_expansion_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "network_expansion_orders_update_admin"
  ON network_expansion_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid())
  );

COMMENT ON TABLE ai_escalations IS 'Escalações do chatbot IA quando não consegue resolver';
COMMENT ON TABLE ai_learning_entries IS 'Entradas de aprendizado extraídas de escalações resolvidas';
COMMENT ON TABLE network_expansion_orders IS 'Pedidos de expansão de rede (filiais) via checkout self-service';

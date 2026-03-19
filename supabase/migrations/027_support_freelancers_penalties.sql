-- =====================================================
-- Migration 027 — Suporte + Freelancers + Penalidades
--
-- MÓDULOS:
--   1. Suporte Inteligente (tickets + SLA + escalonamento)
--   2. Penalidades Progressivas para Afiliados
--   3. Marketplace de Freelancers
--   4. Auditoria Completa (system_logs)
--   5. Cron Automations
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. ALTERAÇÕES EM TABELAS EXISTENTES
-- ─────────────────────────────────────────────────────

-- Adiciona strikes e last_response_at em affiliates
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS strikes         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;

-- Adiciona support_owner em restaurants (quem é responsável pelo suporte)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS support_owner   TEXT NOT NULL DEFAULT 'affiliate'
    CHECK (support_owner IN ('affiliate', 'admin', 'freelancer'));

-- ─────────────────────────────────────────────────────
-- 2. TICKETS DE SUPORTE
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Quem abriu
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  opened_by       UUID REFERENCES auth.users(id),
  -- Atribuição
  assigned_to     UUID REFERENCES auth.users(id),       -- afiliado ou admin
  assigned_type   TEXT NOT NULL DEFAULT 'affiliate'
                  CHECK (assigned_type IN ('affiliate', 'admin', 'freelancer')),
  -- Classificação
  priority        TEXT NOT NULL DEFAULT 'operational'
                  CHECK (priority IN ('critical', 'operational', 'low')),
  category        TEXT NOT NULL DEFAULT 'geral'
                  CHECK (category IN (
                    'erro_sistema', 'pagamento', 'pedido_falhando',   -- críticos
                    'cardapio', 'configuracao', 'duvida', 'geral',    -- operacionais
                    'sugestao', 'feedback'                            -- low
                  )),
  -- Estado
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'escalated', 'resolved', 'closed')),
  subject         TEXT NOT NULL,
  -- SLA
  sla_deadline    TIMESTAMPTZ,                -- prazo de 30 min para primeira resposta
  first_response_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  escalated_at    TIMESTAMPTZ,
  escalated_reason TEXT,
  -- Metadados
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_restaurant    ON support_tickets(restaurant_id);
CREATE INDEX idx_tickets_assigned      ON support_tickets(assigned_to);
CREATE INDEX idx_tickets_status        ON support_tickets(status) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_tickets_sla           ON support_tickets(sla_deadline) WHERE status IN ('open', 'in_progress');
CREATE INDEX idx_tickets_priority      ON support_tickets(priority);

-- Trigger updated_at
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────
-- 3. MENSAGENS DE TICKET
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL DEFAULT 'customer'
              CHECK (sender_type IN ('customer', 'affiliate', 'admin', 'system')),
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_ticket ON support_messages(ticket_id);

-- ─────────────────────────────────────────────────────
-- 4. PENALIDADES DE AFILIADOS (log imutável)
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_penalties (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id   UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ticket_id      UUID REFERENCES support_tickets(id),
  tipo           TEXT NOT NULL
                 CHECK (tipo IN ('warning', 'commission_reduction', 'client_loss', 'suspension', 'manual')),
  strike_number  INTEGER NOT NULL,
  descricao      TEXT NOT NULL,
  applied_by     UUID REFERENCES auth.users(id),  -- NULL = automático
  reverted_at    TIMESTAMPTZ,
  reverted_by    UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_penalties_affiliate ON affiliate_penalties(affiliate_id);

-- ─────────────────────────────────────────────────────
-- 5. FREELANCERS
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS freelancers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL,
  whatsapp        TEXT,
  especialidades  TEXT[] DEFAULT '{}',   -- ex: {'cardapio', 'design', 'configuracao'}
  portfolio_url   TEXT,
  avatar_url      TEXT,
  cidade          TEXT,
  estado          TEXT,
  -- Métricas
  rating_avg      NUMERIC(3,2) DEFAULT 0,
  jobs_completed  INTEGER DEFAULT 0,
  -- Status
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'blocked')),
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_freelancers_user    ON freelancers(user_id);
CREATE INDEX idx_freelancers_status         ON freelancers(status);
CREATE INDEX idx_freelancers_especialidades ON freelancers USING GIN(especialidades);

CREATE TRIGGER freelancers_updated_at
  BEFORE UPDATE ON freelancers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────
-- 6. JOBS DE FREELANCERS
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS freelancer_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id   UUID REFERENCES freelancers(id) ON DELETE SET NULL,
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  ticket_id       UUID REFERENCES support_tickets(id),
  -- Tarefa
  titulo          TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  checklist       JSONB DEFAULT '[]',          -- [{item: "...", done: false}]
  tipo            TEXT NOT NULL DEFAULT 'cardapio'
                  CHECK (tipo IN ('cardapio', 'design', 'configuracao', 'personalizado')),
  -- Controle
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'assigned', 'in_progress', 'review', 'completed', 'cancelled')),
  valor           DECIMAL(10,2),
  prazo           TIMESTAMPTZ NOT NULL,
  max_revisoes    INTEGER NOT NULL DEFAULT 2,
  revisoes_usadas INTEGER NOT NULL DEFAULT 0,
  -- Atribuição
  assigned_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES auth.users(id),
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  -- Meta
  created_by      UUID REFERENCES auth.users(id),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_freelancer  ON freelancer_jobs(freelancer_id);
CREATE INDEX idx_jobs_restaurant  ON freelancer_jobs(restaurant_id);
CREATE INDEX idx_jobs_status      ON freelancer_jobs(status) WHERE status NOT IN ('completed', 'cancelled');

CREATE TRIGGER freelancer_jobs_updated_at
  BEFORE UPDATE ON freelancer_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────
-- 7. ACESSOS TEMPORÁRIOS DE FREELANCERS
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS freelancer_access (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id   UUID NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES freelancer_jobs(id) ON DELETE CASCADE,
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  permissions     TEXT[] NOT NULL DEFAULT '{edit_menu}',   -- granular
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  revoked_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_freelancer ON freelancer_access(freelancer_id);
CREATE INDEX idx_access_active     ON freelancer_access(expires_at)
  WHERE revoked_at IS NULL;

-- ─────────────────────────────────────────────────────
-- 8. SYSTEM_LOGS (auditoria universal)
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,                -- quem fez (NULL = sistema/cron)
  actor_type  TEXT NOT NULL DEFAULT 'system'
              CHECK (actor_type IN ('admin', 'affiliate', 'freelancer', 'customer', 'system', 'cron')),
  action      TEXT NOT NULL,       -- ex: 'ticket.escalated', 'penalty.applied', 'access.granted'
  entity      TEXT NOT NULL,       -- ex: 'support_ticket', 'affiliate', 'freelancer_job'
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_syslog_actor    ON system_logs(actor_id);
CREATE INDEX idx_syslog_entity   ON system_logs(entity, entity_id);
CREATE INDEX idx_syslog_action   ON system_logs(action);
CREATE INDEX idx_syslog_created  ON system_logs(created_at);

-- Partição por mês (performance em escala)
-- Nota: em Supabase free tier, usar cleanup via cron em vez de partitioning.
-- Logs > 90 dias serão limpos pelo cron job.

-- ─────────────────────────────────────────────────────
-- 9. RLS — Row Level Security
-- ─────────────────────────────────────────────────────

ALTER TABLE support_tickets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_access   ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs         ENABLE ROW LEVEL SECURITY;

-- Service role (backend) pode tudo
CREATE POLICY "tickets_service_all"     ON support_tickets     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "messages_service_all"    ON support_messages    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "penalties_service_all"   ON affiliate_penalties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "freelancers_service_all" ON freelancers         FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "jobs_service_all"        ON freelancer_jobs     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "access_service_all"      ON freelancer_access   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "syslog_service_all"      ON system_logs         FOR ALL USING (auth.role() = 'service_role');

-- Freelancer vê apenas seus próprios dados
CREATE POLICY "freelancer_select_own" ON freelancers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "freelancer_jobs_own" ON freelancer_jobs
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

CREATE POLICY "freelancer_access_own" ON freelancer_access
  FOR SELECT USING (
    freelancer_id IN (SELECT id FROM freelancers WHERE user_id = auth.uid())
  );

-- Cliente vê seus próprios tickets
CREATE POLICY "tickets_customer_own" ON support_tickets
  FOR SELECT USING (opened_by = auth.uid());

CREATE POLICY "messages_customer_own" ON support_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE opened_by = auth.uid())
  );

-- Afiliado vê tickets dos seus clientes
CREATE POLICY "tickets_affiliate_own" ON support_tickets
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "messages_affiliate_own" ON support_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE assigned_to = auth.uid())
  );

-- Afiliado vê suas próprias penalidades
CREATE POLICY "penalties_affiliate_own" ON affiliate_penalties
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────
-- 10. FUNÇÕES AUXILIARES
-- ─────────────────────────────────────────────────────

-- Função: escalar ticket (SLA estourado)
CREATE OR REPLACE FUNCTION escalate_ticket(p_ticket_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ticket RECORD;
  v_affiliate RECORD;
BEGIN
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_ticket.status IN ('resolved', 'closed', 'escalated') THEN RETURN; END IF;

  -- Escalar ticket
  UPDATE public.support_tickets SET
    status = 'escalated',
    escalated_at = NOW(),
    escalated_reason = 'SLA de 30 minutos estourado',
    assigned_type = 'admin',
    updated_at = NOW()
  WHERE id = p_ticket_id;

  -- Aplicar strike no afiliado
  IF v_ticket.assigned_to IS NOT NULL THEN
    SELECT * INTO v_affiliate
    FROM public.affiliates
    WHERE user_id = v_ticket.assigned_to;

    IF FOUND THEN
      UPDATE public.affiliates SET
        strikes = strikes + 1,
        updated_at = NOW()
      WHERE id = v_affiliate.id;

      -- Log de penalidade
      INSERT INTO public.affiliate_penalties (affiliate_id, ticket_id, tipo, strike_number, descricao)
      VALUES (
        v_affiliate.id,
        p_ticket_id,
        CASE
          WHEN v_affiliate.strikes + 1 = 1 THEN 'warning'
          WHEN v_affiliate.strikes + 1 = 2 THEN 'commission_reduction'
          WHEN v_affiliate.strikes + 1 >= 3 THEN 'client_loss'
        END,
        v_affiliate.strikes + 1,
        'SLA de 30 minutos estourado — ticket #' || LEFT(p_ticket_id::TEXT, 8)
      );

      -- 3+ strikes: transferir SOMENTE o cliente deste ticket para admin
      -- O afiliado NÃO é suspenso, apenas perde o cliente sem suporte
      IF v_affiliate.strikes + 1 >= 3 THEN
        UPDATE public.restaurants SET
          support_owner = 'admin'
        WHERE id = v_ticket.restaurant_id;

        -- Reset strikes após perder o cliente (ciclo limpo)
        UPDATE public.affiliates SET
          strikes = 0,
          updated_at = NOW()
        WHERE id = v_affiliate.id;
      END IF;
    END IF;
  END IF;

  -- System log
  INSERT INTO public.system_logs (actor_type, action, entity, entity_id, metadata)
  VALUES ('cron', 'ticket.escalated', 'support_ticket', p_ticket_id,
    jsonb_build_object('reason', 'sla_breach', 'original_assigned', v_ticket.assigned_to));
END;
$$;

-- Função: expirar acessos de freelancers
CREATE OR REPLACE FUNCTION expire_freelancer_access()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.freelancer_access SET
      revoked_at = NOW()
    WHERE expires_at < NOW()
      AND revoked_at IS NULL
    RETURNING id, freelancer_id, job_id
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  IF v_count > 0 THEN
    INSERT INTO public.system_logs (actor_type, action, entity, entity_id, metadata)
    VALUES ('cron', 'access.expired_batch', 'freelancer_access', NULL,
      jsonb_build_object('count', v_count));
  END IF;

  RETURN v_count;
END;
$$;

-- Função: verificar SLA e escalar tickets vencidos
CREATE OR REPLACE FUNCTION check_sla_and_escalate()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ticket RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_ticket IN
    SELECT id FROM public.support_tickets
    WHERE status IN ('open', 'in_progress')
      AND sla_deadline IS NOT NULL
      AND sla_deadline < NOW()
      AND first_response_at IS NULL
  LOOP
    PERFORM public.escalate_ticket(v_ticket.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────────────
-- 11. COMMENTS
-- ─────────────────────────────────────────────────────
COMMENT ON TABLE support_tickets IS 'Tickets de suporte com SLA de 30 min e escalonamento automático';
COMMENT ON TABLE support_messages IS 'Mensagens de cada ticket (histórico completo)';
COMMENT ON TABLE affiliate_penalties IS 'Log imutável de penalidades aplicadas a afiliados';
COMMENT ON TABLE freelancers IS 'Marketplace de freelancers para execução de tarefas';
COMMENT ON TABLE freelancer_jobs IS 'Jobs atribuídos a freelancers com checklist e prazo';
COMMENT ON TABLE freelancer_access IS 'Acessos temporários de freelancers a restaurantes';
COMMENT ON TABLE system_logs IS 'Auditoria universal de todas as ações do sistema';
COMMENT ON COLUMN affiliates.strikes IS 'Número de falhas de SLA. 1=aviso, 2=comissão reduzida, 3=perde cliente';

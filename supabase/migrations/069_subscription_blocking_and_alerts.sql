-- ===== Subscription Blocking & Alerts System (SaaS Standard) =====
-- Implementa bloqueio automático de cardápio após 90 dias sem pagamento
-- com alertas prévios via WhatsApp
--
-- Workflow:
-- 1. Dia 0-90: Ativo (pode editar livremente)
-- 2. Dia 83 (7 dias antes): ALERTA WhatsApp "Pague em 7 dias ou bloqueamos"
-- 3. Dia 90: BLOQUEADO - cardapio travado, editor desativado
-- 4. Ao pagar: DESBLOQUEADO - volta como estava antes
--
-- Boas práticas SaaS:
-- - Grace period de 7 dias para avisos antes do bloqueio
-- - Notificação progressiva (dia 83 ALERTA, dia 87 AVISO, dia 89 CRÍTICO)
-- - Desbloqueio automático ao receber pagamento (webhook)
-- - Visibilidade total no painel do usuario
BEGIN;
-- ===== 1. EXTEND TABLES =====
-- Adicionar campos na tabela subscriptions se não existirem
ALTER TABLE IF EXISTS public.subscriptions
ADD COLUMN IF NOT EXISTS suspension_grace_days INTEGER DEFAULT 7,
    ADD COLUMN IF NOT EXISTS alert_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS alert_type TEXT,
    -- 'warning'|'critical'|'blocked'
ADD COLUMN IF NOT EXISTS blocked_reason TEXT DEFAULT 'Pagamento vencido',
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS unblocked_at TIMESTAMPTZ;
-- Tabela de histórico de alertas (para não reenviar notificações)
CREATE TABLE IF NOT EXISTS public.subscription_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    -- 'warning_7days'|'critical_3days'|'blocked'|'payment_received'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    whatsapp_number TEXT,
    whatsapp_response_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_alert_per_type UNIQUE (restaurant_id, alert_type, DATE(sent_at))
);
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_restaurant ON public.subscription_alerts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_alerts_alert_type ON public.subscription_alerts(alert_type);
-- ===== 2. RPC: Check subscription access =====
-- Verifica se um delivery pode editar seu cardápio
CREATE OR REPLACE FUNCTION public.can_edit_restaurant(p_restaurant_id UUID) RETURNS TABLE(
        can_edit BOOLEAN,
        is_blocked BOOLEAN,
        reason TEXT,
        days_until_block INTEGER,
        subscription_status TEXT
    ) AS $$
DECLARE v_sub RECORD;
v_days_overdue INTEGER;
v_can_edit BOOLEAN;
v_is_blocked BOOLEAN;
BEGIN -- Buscar subscription ativa
SELECT s.id,
    s.status,
    s.current_period_end,
    s.suspended,
    r.suspended INTO v_sub
FROM public.subscriptions s
    LEFT JOIN public.restaurants r ON r.id = s.restaurant_id
WHERE s.restaurant_id = p_restaurant_id
LIMIT 1;
-- Se não tem subscription, bloqueia
IF v_sub IS NULL THEN RETURN QUERY
SELECT false,
    true,
    'Nenhuma assinatura ativa'::TEXT,
    NULL::INTEGER,
    NULL::TEXT;
RETURN;
END IF;
-- Se já está suspenso/bloqueado, retorna bloqueado
IF COALESCE(v_sub.suspended, false)
OR v_sub.status = 'past_due' THEN v_days_overdue := EXTRACT(
    DAY
    FROM NOW() - v_sub.current_period_end
)::INTEGER;
RETURN QUERY
SELECT false,
    true,
    'Cardápio bloqueado por falta de pagamento. Pague para reativar.'::TEXT,
    0,
    'blocked'::TEXT;
RETURN;
END IF;
-- Se está ativo, calcula dias até vencer
IF v_sub.status = 'active'
OR v_sub.status = 'trial' THEN v_days_overdue := EXTRACT(
    DAY
    FROM v_sub.current_period_end - NOW()
)::INTEGER;
IF v_days_overdue > 0 THEN -- Ainda está ativo
RETURN QUERY
SELECT true,
    false,
    NULL::TEXT,
    v_days_overdue,
    'active'::TEXT;
ELSE -- Expirou, bloqueia
RETURN QUERY
SELECT false,
    true,
    'Assinatura expirada'::TEXT,
    0,
    'expired'::TEXT;
END IF;
END IF;
-- Fallback
RETURN QUERY
SELECT false,
    true,
    'Status desconhecido'::TEXT,
    NULL::INTEGER,
    v_sub.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- ===== 3. RPC: Auto-block overdue subscriptions =====
-- Executa a cada 6 horas via CRON
CREATE OR REPLACE FUNCTION public.auto_block_overdue_subscriptions(p_grace_days INTEGER DEFAULT 7) RETURNS TABLE(
        blocked_count INTEGER,
        alerted_7days_count INTEGER,
        alerted_3days_count INTEGER
    ) AS $$
DECLARE v_blocked INTEGER := 0;
v_alerted_7 INTEGER := 0;
v_alerted_3 INTEGER := 0;
BEGIN -- ===== BLOQUEAR: Subscrições que venceram há mais de X dias =====
UPDATE public.subscriptions s
SET suspended = true,
    blocked_at = NOW(),
    blocked_reason = 'Pagamento vencido por ' || EXTRACT(
        DAY
        FROM NOW() - current_period_end
    )::TEXT || ' dias'
FROM public.restaurants r
WHERE s.restaurant_id = r.id
    AND s.status = 'active'
    AND s.current_period_end < NOW() - INTERVAL '1' DAY * p_grace_days
    AND COALESCE(r.suspended, false) = false
    AND COALESCE(s.suspended, false) = false;
GET DIAGNOSTICS v_blocked = ROW_COUNT;
-- ===== ALERTA 7 DIAS: Vencimento em 7 dias =====
WITH to_alert_7days AS (
    SELECT s.id,
        s.restaurant_id
    FROM public.subscriptions s
        JOIN public.restaurants r ON r.id = s.restaurant_id
    WHERE s.status = 'active'
        AND COALESCE(r.suspended, false) = false
        AND s.current_period_end BETWEEN NOW()
        AND NOW() + INTERVAL '7 days'
        AND s.current_period_end > NOW() + INTERVAL '6 days'
        AND NOT EXISTS (
            SELECT 1
            FROM public.subscription_alerts sa
            WHERE sa.subscription_id = s.id
                AND sa.alert_type = 'warning_7days'
                AND DATE(sa.sent_at) = CURRENT_DATE
        )
)
INSERT INTO public.subscription_alerts (
        restaurant_id,
        subscription_id,
        alert_type,
        whatsapp_number
    )
SELECT t.restaurant_id,
    t.id,
    'warning_7days'::TEXT,
    r.whatsapp_para_pedidos
FROM to_alert_7days t
    JOIN public.restaurants r ON r.id = t.restaurant_id ON CONFLICT DO NOTHING;
GET DIAGNOSTICS v_alerted_7 = ROW_COUNT;
-- ===== ALERTA 3 DIAS: Vencimento em 3 dias (crítico) =====
WITH to_alert_3days AS (
    SELECT s.id,
        s.restaurant_id
    FROM public.subscriptions s
        JOIN public.restaurants r ON r.id = s.restaurant_id
    WHERE s.status = 'active'
        AND COALESCE(r.suspended, false) = false
        AND s.current_period_end BETWEEN NOW()
        AND NOW() + INTERVAL '3 days'
        AND s.current_period_end > NOW() + INTERVAL '2 days'
        AND NOT EXISTS (
            SELECT 1
            FROM public.subscription_alerts sa
            WHERE sa.subscription_id = s.id
                AND sa.alert_type = 'critical_3days'
                AND DATE(sa.sent_at) = CURRENT_DATE
        )
)
INSERT INTO public.subscription_alerts (
        restaurant_id,
        subscription_id,
        alert_type,
        whatsapp_number
    )
SELECT t.restaurant_id,
    t.id,
    'critical_3days'::TEXT,
    r.whatsapp_para_pedidos
FROM to_alert_3days t
    JOIN public.restaurants r ON r.id = t.restaurant_id ON CONFLICT DO NOTHING;
GET DIAGNOSTICS v_alerted_3 = ROW_COUNT;
RETURN QUERY
SELECT v_blocked,
    v_alerted_7,
    v_alerted_3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- ===== 4. RPC: Unlock subscription on payment =====
-- Chamado pelo webhook de pagamento recebido
CREATE OR REPLACE FUNCTION public.unlock_subscription_on_payment(p_restaurant_id UUID) RETURNS TABLE(unlocked BOOLEAN, message TEXT) AS $$ BEGIN
UPDATE public.subscriptions s
SET suspended = false,
    status = 'active',
    unblocked_at = NOW(),
    blocked_reason = NULL
FROM public.restaurants r
WHERE s.restaurant_id = r.id
    AND s.restaurant_id = p_restaurant_id;
INSERT INTO public.subscription_alerts (restaurant_id, alert_type)
VALUES (p_restaurant_id, 'payment_received'::TEXT) ON CONFLICT DO NOTHING;
RETURN QUERY
SELECT true,
    'Assinatura reativada. Cardápio desbloqueado.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- ===== 5. ALERTA WhatsApp: função para formatar mensagem =====
CREATE OR REPLACE FUNCTION public.format_subscription_alert_message(
        p_alert_type TEXT,
        p_restaurant_name TEXT,
        p_days_until_block INTEGER
    ) RETURNS TEXT AS $$
DECLARE v_message TEXT;
BEGIN CASE
    p_alert_type
    WHEN 'warning_7days' THEN v_message := '⚠️ *' || p_restaurant_name || '* - Seu cardápio vence em 7 DIAS' || E'\n' || 'Se você não renovar sua assinatura, seu cardápio digital será bloqueado.' || E'\n\n' || '👉 Clique para renovar: https://zairyx.com.br/meus-templates';
WHEN 'critical_3days' THEN v_message := '🚨 *ATENÇÃO* - ' || p_restaurant_name || ' 🚨' || E'\n' || 'Seu cardápio vence em APENAS 3 DIAS!' || E'\n' || 'Não espere - renove agora para não perder vendas!' || E'\n\n' || '👉 Renovar agora: https://zairyx.com.br/meus-templates';
WHEN 'blocked' THEN v_message := '❌ *Cardápio Bloqueado* - ' || p_restaurant_name || E'\n' || 'Sua assinatura expirou e seu cardápio foi bloqueado.' || E'\n' || 'Você NÃO pode receber novos pedidos até renovar.' || E'\n\n' || '👉 Reativar agora: https://zairyx.com.br/meus-templates/renovar';
WHEN 'payment_received' THEN v_message := '✅ *Sucesso!* - ' || p_restaurant_name || E'\n' || 'Seu pagamento foi recebido. Cardápio desbloqueado!' || E'\n' || 'Você já pode receber pedidos normalmente.';
ELSE v_message := 'Alerta de assinatura: ' || p_alert_type;
END CASE
;
RETURN v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
-- ===== 6. RLS Policies =====
-- Permettir que restaurant veja sua própria assinatura
CREATE POLICY "subscription_access_self" ON public.subscriptions FOR
SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT id
            FROM public.restaurants
            WHERE user_id = auth.uid()
                OR id IN (
                    SELECT restaurant_id
                    FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
        )
    );
CREATE POLICY "subscription_alerts_view_self" ON public.subscription_alerts FOR
SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT id
            FROM public.restaurants
            WHERE user_id = auth.uid()
        )
    );
-- ===== 7. Índices para performance =====
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period ON public.subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_suspended ON public.subscriptions(suspended)
WHERE suspended = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_blocked_at ON public.subscriptions(blocked_at);
-- ===== 8. Comment documentation =====
COMMENT ON TABLE public.subscription_alerts IS 'Histórico de alertas enviados para subscriptions. Evita reenvios duplicados.';
COMMENT ON FUNCTION public.can_edit_restaurant IS 'Verifica se um delivery pode editar seu cardápio. Retorna motivo se bloqueado.';
COMMENT ON FUNCTION public.auto_block_overdue_subscriptions IS 'CRON: Bloqueia subscriptions vencidas e cria alertas. Executar a cada 6 horas.';
COMMENT ON FUNCTION public.unlock_subscription_on_payment IS 'Webhook callback: Desbloqueia subscription quando pagamento recebido.';
COMMIT;
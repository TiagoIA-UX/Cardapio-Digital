-- ========================================
-- Pagamento Real para Pedidos de Delivery
-- Migração 042
-- ========================================
-- Integração com Mercado Pago Preference API
-- para pagamentos reais (PIX + Cartão) em pedidos de comida.
-- Substitui o PIX mock da migration 041 por fluxo real.
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tabela: delivery_payments ─────────────────────────────────────
-- Registra cada tentativa de pagamento de pedido de delivery
-- via Mercado Pago Preference API.

CREATE TABLE IF NOT EXISTS public.delivery_payments (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    order_id UUID NOT NULL,
    mp_preference_id TEXT,
    mp_payment_id TEXT,
    checkout_url TEXT,
    sandbox_checkout_url TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')
    ),
    payment_method_used TEXT,
    paid_at TIMESTAMPTZ,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    whatsapp_link TEXT,
    whatsapp_sent_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    UNIQUE (order_id)
);

-- ── Índices ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_delivery_payments_restaurant_id
    ON public.delivery_payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_delivery_payments_order_id
    ON public.delivery_payments(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_payments_status
    ON public.delivery_payments(status);

CREATE INDEX IF NOT EXISTS idx_delivery_payments_mp_preference_id
    ON public.delivery_payments(mp_preference_id);

CREATE INDEX IF NOT EXISTS idx_delivery_payments_created_at
    ON public.delivery_payments(created_at DESC);

-- ── Trigger para updated_at ───────────────────────────────────────

CREATE TRIGGER set_updated_at_delivery_payments
    BEFORE UPDATE ON public.delivery_payments
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────

ALTER TABLE public.delivery_payments ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
CREATE POLICY "Admin delivery_payments select"
    ON public.delivery_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
                AND au.role IN ('admin', 'owner')
        )
    );

-- Dono do delivery pode ver seus pagamentos
CREATE POLICY "Owner delivery_payments select"
    ON public.delivery_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = restaurant_id
                AND r.user_id = auth.uid()
        )
    );

-- Service role pode fazer tudo (webhook, cron, admin)
CREATE POLICY "System delivery_payments admin"
    ON public.delivery_payments FOR ALL USING (true);

-- ── Campo mp_delivery_enabled nos restaurantes ────────────────────
-- Habilita/desabilita pagamento via MP para pedidos de delivery

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS mp_delivery_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE public.delivery_payments IS 'Pagamentos reais via Mercado Pago para pedidos de delivery (PIX + Cartão)';
COMMENT ON COLUMN public.delivery_payments.mp_preference_id IS 'ID da Preference criada no Mercado Pago';
COMMENT ON COLUMN public.delivery_payments.mp_payment_id IS 'ID do pagamento confirmado pelo Mercado Pago';
COMMENT ON COLUMN public.delivery_payments.checkout_url IS 'URL de checkout (init_point) do Mercado Pago';
COMMENT ON COLUMN public.delivery_payments.sandbox_checkout_url IS 'URL de checkout sandbox (sandbox_init_point)';
COMMENT ON COLUMN public.delivery_payments.whatsapp_link IS 'Link WhatsApp gerado após confirmação do pagamento';
COMMENT ON COLUMN public.restaurants.mp_delivery_enabled IS 'Se true, habilita pagamento via MP para pedidos de delivery';

-- =====================================================
-- 083: Fila persistida de retry para sincronização de financial_truth
--
-- Objetivo:
-- - impedir que falhas transitórias virem bloqueio financeiro silencioso
-- - persistir pending_sync com retry explícito e escalada manual após esgotar tentativas
-- - manter financial_truth como verdade econômica, separando transporte/sync da semântica do status
-- =====================================================
CREATE TABLE IF NOT EXISTS public.financial_truth_sync_queue (
    tenant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending_sync' CHECK (
        status IN ('pending_sync', 'synced', 'failed')
    ),
    source TEXT NOT NULL CHECK (
        source IN ('subscription', 'payment', 'reconciliation')
    ),
    source_id TEXT,
    retry_attempts INTEGER NOT NULL DEFAULT 0 CHECK (retry_attempts >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1),
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ,
    last_error TEXT,
    raw_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    escalated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_truth_sync_queue_status_retry
    ON public.financial_truth_sync_queue (status, next_retry_at);

CREATE INDEX IF NOT EXISTS idx_financial_truth_sync_queue_updated_at
    ON public.financial_truth_sync_queue (updated_at DESC);

DROP TRIGGER IF EXISTS set_financial_truth_sync_queue_updated_at ON public.financial_truth_sync_queue;
CREATE TRIGGER set_financial_truth_sync_queue_updated_at BEFORE
UPDATE ON public.financial_truth_sync_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.financial_truth_sync_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System financial_truth_sync_queue admin" ON public.financial_truth_sync_queue;
CREATE POLICY "System financial_truth_sync_queue admin" ON public.financial_truth_sync_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.financial_truth_sync_queue IS 'Fila persistida de retry para sincronização de financial_truth';
COMMENT ON COLUMN public.financial_truth_sync_queue.status IS 'Estado do transporte do sync: pending_sync, synced ou failed';
COMMENT ON COLUMN public.financial_truth_sync_queue.escalated_at IS 'Momento em que a falha exigiu revisão manual após esgotar retries';
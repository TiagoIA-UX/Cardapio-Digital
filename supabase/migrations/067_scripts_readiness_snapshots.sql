-- =====================================================
-- MIGRATION 067 -- Scripts Readiness Snapshots
-- Historico para deduplicacao e escalacao de alertas
-- =====================================================
CREATE TABLE IF NOT EXISTS scripts_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_checks INTEGER NOT NULL,
    healthy_checks INTEGER NOT NULL,
    attention_checks INTEGER NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    fingerprint TEXT NOT NULL,
    categories JSONB NOT NULL DEFAULT '[]'::JSONB,
    attention_items JSONB NOT NULL DEFAULT '[]'::JSONB,
    source TEXT NOT NULL DEFAULT 'cron' CHECK (source IN ('cron', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scripts_readiness_generated_at ON scripts_readiness_snapshots(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scripts_readiness_fingerprint ON scripts_readiness_snapshots(fingerprint);
CREATE INDEX IF NOT EXISTS idx_scripts_readiness_attention ON scripts_readiness_snapshots(attention_checks, generated_at DESC);
ALTER TABLE scripts_readiness_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scripts_readiness_snapshots_service_role" ON scripts_readiness_snapshots;
CREATE POLICY "scripts_readiness_snapshots_service_role" ON scripts_readiness_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
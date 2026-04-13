-- =====================================================
-- MIGRATION 066 — Marketing CRM + Newsletter Automation
-- Contatos, campanhas e envios para automação semanal
-- =====================================================
-- ─── 1. MARKETING CONTACTS ───────────────────────────
CREATE TABLE IF NOT EXISTS marketing_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    tags TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    consented_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON marketing_contacts(email);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_source ON marketing_contacts(source);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_unsubscribed_at ON marketing_contacts(unsubscribed_at);
-- ─── 2. MARKETING CAMPAIGNS ──────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    segment JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'scheduled',
            'running',
            'finished',
            'failed'
        )
    ),
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    stats JSONB NOT NULL DEFAULT '{"sent":0,"failed":0,"skipped":0}'::JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled_for ON marketing_campaigns(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at ON marketing_campaigns(created_at DESC);
-- ─── 3. MARKETING CAMPAIGN SENDS ─────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaign_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES marketing_contacts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (
        status IN ('queued', 'sent', 'failed', 'unsubscribed')
    ),
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_campaign_id ON marketing_campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_contact_id ON marketing_campaign_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_status ON marketing_campaign_sends(status);
-- ─── 4. RLS (service_role) ───────────────────────────
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_contacts_service_role" ON marketing_contacts;
CREATE POLICY "marketing_contacts_service_role" ON marketing_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_campaigns_service_role" ON marketing_campaigns;
CREATE POLICY "marketing_campaigns_service_role" ON marketing_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marketing_campaign_sends_service_role" ON marketing_campaign_sends;
CREATE POLICY "marketing_campaign_sends_service_role" ON marketing_campaign_sends FOR ALL TO service_role USING (true) WITH CHECK (true);
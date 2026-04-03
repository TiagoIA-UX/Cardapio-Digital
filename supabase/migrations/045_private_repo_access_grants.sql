-- =====================================================================
-- 045 — Private Repo Access Grants — Ledger comercial de acesso ao código
-- =====================================================================
CREATE TABLE IF NOT EXISTS private_repo_access_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository TEXT NOT NULL,
    github_username TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    template_slug TEXT NOT NULL,
    plan TEXT NOT NULL,
    paid_amount_cents INTEGER NOT NULL CHECK (paid_amount_cents > 0),
    paid_currency TEXT NOT NULL DEFAULT 'BRL',
    permission TEXT NOT NULL DEFAULT 'pull' CHECK (permission IN ('pull')),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private')),
    license_model TEXT NOT NULL DEFAULT 'BUSL-1.1 + commercial grant',
    expires_at TIMESTAMPTZ,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by_admin_id TEXT NOT NULL,
    granted_by_admin_email TEXT NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by_admin_id TEXT,
    revoked_by_admin_email TEXT,
    revoked_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT private_repo_access_grants_unique_target UNIQUE (repository, github_username, template_slug)
);
CREATE INDEX IF NOT EXISTS idx_private_repo_access_repository ON private_repo_access_grants(repository);
CREATE INDEX IF NOT EXISTS idx_private_repo_access_customer_email ON private_repo_access_grants(customer_email);
CREATE INDEX IF NOT EXISTS idx_private_repo_access_template ON private_repo_access_grants(template_slug);
CREATE INDEX IF NOT EXISTS idx_private_repo_access_revoked_at ON private_repo_access_grants(revoked_at);
CREATE INDEX IF NOT EXISTS idx_private_repo_access_granted_at ON private_repo_access_grants(granted_at DESC);
ALTER TABLE private_repo_access_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "private_repo_access_grants_select_admin" ON private_repo_access_grants;
CREATE POLICY "private_repo_access_grants_select_admin" ON private_repo_access_grants FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "private_repo_access_grants_insert_admin" ON private_repo_access_grants;
CREATE POLICY "private_repo_access_grants_insert_admin" ON private_repo_access_grants FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "private_repo_access_grants_update_admin" ON private_repo_access_grants;
CREATE POLICY "private_repo_access_grants_update_admin" ON private_repo_access_grants FOR
UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );
DROP TRIGGER IF EXISTS trigger_private_repo_access_grants_updated_at ON private_repo_access_grants;
CREATE TRIGGER trigger_private_repo_access_grants_updated_at BEFORE
UPDATE ON private_repo_access_grants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
COMMENT ON TABLE private_repo_access_grants IS 'Ledger comercial de concessão e revogação de acesso ao repositório privado';
COMMENT ON COLUMN private_repo_access_grants.metadata IS 'Comandos, checklist, observações e trilha operacional';
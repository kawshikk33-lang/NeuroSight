-- =====================================================
-- NeuroSight Audit Trail Migration — Supabase SQL
-- =====================================================
-- Run this in Supabase SQL Editor to create the audit_logs table.
-- This is the Supabase-compatible version of Alembic migration 0005.
-- =====================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email      VARCHAR(255),
    event_type      VARCHAR(50) NOT NULL,
    resource_type   VARCHAR(100),
    resource_id     VARCHAR(255),
    resource_name   VARCHAR(500),
    action          VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    request_id      UUID,
    method          VARCHAR(10),
    path            VARCHAR(500),
    before_state    JSONB,
    after_state     JSONB,
    metadata        JSONB NOT NULL DEFAULT '{}',
    status_code     INTEGER,
    error_message   TEXT,
    is_sensitive    BOOLEAN NOT NULL DEFAULT false,
    retention_days  INTEGER NOT NULL DEFAULT 365,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast querying
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id       ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type    ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_event    ON audit_logs (user_id, event_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_resource      ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_id   ON audit_logs (resource_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created       ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS ix_audit_logs_ip            ON audit_logs (ip_address);

-- 3. Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can see all audit logs
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Non-admin users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- No one can UPDATE or DELETE audit logs (append-only)
CREATE POLICY "No updates on audit logs"
    ON audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "No deletes on audit logs"
    ON audit_logs
    FOR DELETE
    USING (false);

-- 4. Trigger to enforce append-only at database level
--    This is a safety net on top of RLS policies
CREATE OR REPLACE FUNCTION prevent_audit_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Cannot update or delete audit log entries. Audit logs are immutable for compliance.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_prevent_audit_log_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modifications();

-- 5. Comment for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit log for compliance (SOC 2, GDPR). APPEND-ONLY. No UPDATE or DELETE allowed.';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running, verify with:
-- SELECT COUNT(*) FROM audit_logs;  -- Should be 0 initially
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs';  -- Should return 1 row
-- =====================================================

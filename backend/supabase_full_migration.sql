-- =====================================================
-- NeuroSight — Complete Supabase Schema Update
-- =====================================================
-- Run this ENTIRE file in Supabase SQL Editor.
-- Creates: engineered_features, audit_logs, alert_rules, alert_notifications, data_connectors
-- =====================================================
-- Estimated time: < 2 minutes
-- Safety: All statements use IF NOT EXISTS / idempotent patterns
-- =====================================================


-- =====================================================
-- TABLE 1: engineered_features
-- =====================================================
CREATE TABLE IF NOT EXISTS engineered_features (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    formula         VARCHAR(1024) NOT NULL,
    feature_type    VARCHAR(50) NOT NULL DEFAULT 'numeric',
    description     VARCHAR(512),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_engineered_features_user_id ON engineered_features (user_id);


-- =====================================================
-- TABLE 2: audit_logs (immutable — for SOC 2 / GDPR compliance)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id       ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_event_type    ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_event    ON audit_logs (user_id, event_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_resource      ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_id   ON audit_logs (resource_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created       ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS ix_audit_logs_ip            ON audit_logs (ip_address);


-- =====================================================
-- TABLE 3: alert_rules (smart threshold & anomaly alerts)
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    metric              VARCHAR(100) NOT NULL,
    "condition"          VARCHAR(20) NOT NULL,
    threshold_value     FLOAT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    notification_type   VARCHAR(20) NOT NULL DEFAULT 'in_app',
    use_anomaly_detection BOOLEAN NOT NULL DEFAULT false,
    anomaly_std_devs    INTEGER NOT NULL DEFAULT 3,
    cooldown_seconds    INTEGER NOT NULL DEFAULT 300,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_triggered_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_alert_rules_user_id       ON alert_rules (user_id);
CREATE INDEX IF NOT EXISTS ix_alert_rules_metric        ON alert_rules (metric);
CREATE INDEX IF NOT EXISTS ix_alert_rules_user_metric   ON alert_rules (user_id, metric);
CREATE INDEX IF NOT EXISTS ix_alert_rules_active        ON alert_rules (user_id, is_active);


-- =====================================================
-- TABLE 4: alert_notifications (triggered alert events)
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_id             UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    metric              VARCHAR(100) NOT NULL,
    current_value       FLOAT NOT NULL,
    threshold_value     FLOAT,
    "condition"          VARCHAR(20) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    severity            VARCHAR(20) NOT NULL DEFAULT 'warning',
    trend               VARCHAR(50),
    recommended_action  TEXT,
    context             JSONB NOT NULL DEFAULT '{}',
    is_read             BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_alert_notifications_user_id    ON alert_notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_alert_notifications_rule_id    ON alert_notifications (rule_id);
CREATE INDEX IF NOT EXISTS ix_alert_notifications_is_read    ON alert_notifications (is_read);
CREATE INDEX IF NOT EXISTS ix_alert_notifications_user_read  ON alert_notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS ix_alert_notifications_created    ON alert_notifications (user_id, created_at);


-- =====================================================
-- TABLE 5: data_connectors (external data sources)
-- =====================================================
CREATE TABLE IF NOT EXISTS data_connectors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    connector_type      VARCHAR(50) NOT NULL,  -- database, facebook_ads, google_ads
    config              JSONB NOT NULL DEFAULT '{}',
    status              VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    last_sync_at        TIMESTAMPTZ,
    sync_frequency      VARCHAR(20) NOT NULL DEFAULT 'daily',
    last_error          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_data_connectors_user_id      ON data_connectors (user_id);
CREATE INDEX IF NOT EXISTS ix_data_connectors_type         ON data_connectors (connector_type);
CREATE INDEX IF NOT EXISTS ix_data_connectors_status       ON data_connectors (status);


-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- NOTE:
-- Backend `users.id` is an INTEGER (not Supabase auth UUID). For RLS to work with
-- PostgREST/Supabase, we read an integer `user_id` claim from the request JWT.
-- Your API layer must mint JWTs that include `{"user_id": <int>}` in claims.
CREATE OR REPLACE FUNCTION app_current_user_id_int()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'user_id')::integer
$$;

-- Audit Logs: append-only, admin can see all, users see own
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = app_current_user_id_int()
            AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = app_current_user_id_int());

DROP POLICY IF EXISTS "No updates on audit logs" ON audit_logs;
CREATE POLICY "No updates on audit logs"
    ON audit_logs FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes on audit logs" ON audit_logs;
CREATE POLICY "No deletes on audit logs"
    ON audit_logs FOR DELETE USING (false);


-- Alert Rules: users manage only their own
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own alert rules" ON alert_rules;
CREATE POLICY "Users manage own alert rules"
    ON alert_rules FOR ALL
    USING (user_id = app_current_user_id_int())
    WITH CHECK (user_id = app_current_user_id_int());


-- Alert Notifications: users manage only their own
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON alert_notifications;
CREATE POLICY "Users view own notifications"
    ON alert_notifications FOR SELECT
    USING (user_id = app_current_user_id_int());

DROP POLICY IF EXISTS "Users update own notifications" ON alert_notifications;
CREATE POLICY "Users update own notifications"
    ON alert_notifications FOR UPDATE
    USING (user_id = app_current_user_id_int());

DROP POLICY IF EXISTS "Users delete own notifications" ON alert_notifications;
CREATE POLICY "Users delete own notifications"
    ON alert_notifications FOR DELETE
    USING (user_id = app_current_user_id_int());


-- Data Files + Analysis History: align existing RLS with integer users.id
-- (Replaces earlier policies that compared INTEGER user_id to auth.uid() UUID.)
ALTER TABLE data_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own files" ON data_files;
CREATE POLICY "Users can only view their own files"
    ON data_files FOR SELECT
    USING (user_id = app_current_user_id_int());

DROP POLICY IF EXISTS "Users can only view their own analysis" ON analysis_history;
CREATE POLICY "Users can only view their own analysis"
    ON analysis_history FOR SELECT
    USING (user_id = app_current_user_id_int());


-- Data Connectors: users manage only their own
ALTER TABLE data_connectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own connectors" ON data_connectors;
CREATE POLICY "Users manage own connectors"
    ON data_connectors FOR ALL
    USING (user_id = app_current_user_id_int())
    WITH CHECK (user_id = app_current_user_id_int());


-- =====================================================
-- DATABASE TRIGGERS (safety nets)
-- =====================================================

-- Prevent ANY update or delete on audit_logs (immutable for compliance)
CREATE OR REPLACE FUNCTION prevent_audit_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Cannot update or delete audit log entries. Audit logs are immutable for compliance.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_audit_log_update ON audit_logs;
CREATE TRIGGER trigger_prevent_audit_log_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modifications();


-- =====================================================
-- DOCUMENTATION COMMENTS
-- =====================================================
COMMENT ON TABLE engineered_features IS 'User-defined engineered features for model training.';
COMMENT ON TABLE audit_logs IS 'Immutable audit log for compliance (SOC 2, GDPR). APPEND-ONLY. No UPDATE or DELETE allowed.';
COMMENT ON TABLE alert_rules IS 'User-defined alert rules for metric monitoring and anomaly detection.';
COMMENT ON TABLE alert_notifications IS 'Triggered alert notifications with severity, context, and recommended actions.';
COMMENT ON TABLE data_connectors IS 'External data source connectors (database, Facebook Ads, Google Ads).';


-- =====================================================
-- VERIFICATION — run these queries after executing
-- =====================================================

-- Check that all 5 tables were created:
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('engineered_features', 'audit_logs', 'alert_rules', 'alert_notifications', 'data_connectors')
ORDER BY tablename;
-- Expected output: 5 rows

-- Check RLS is enabled on all tables:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('engineered_features', 'audit_logs', 'alert_rules', 'alert_notifications', 'data_connectors')
ORDER BY tablename;
-- Expected: all should show 't' (true)

-- Check trigger exists on audit_logs:
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'audit_logs';
-- Expected: trigger_prevent_audit_log_update

-- =====================================================
-- NeuroSight Smart Alerts Migration — Supabase SQL
-- =====================================================
-- Run this in Supabase SQL Editor.
-- =====================================================

-- 1. Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    metric              VARCHAR(100) NOT NULL,
    "condition"          VARCHAR(20) NOT NULL,  -- above, below, equal, anomaly
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

-- 2. Alert notifications table
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

-- 3. Row Level Security
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own rules
CREATE POLICY "Users manage own alert rules"
    ON alert_rules FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can only see their own notifications
CREATE POLICY "Users view own notifications"
    ON alert_notifications FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
    ON alert_notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications"
    ON alert_notifications FOR DELETE
    USING (user_id = auth.uid());

COMMENT ON TABLE alert_rules IS 'User-defined alert rules for metric monitoring.';
COMMENT ON TABLE alert_notifications IS 'Triggered alert notifications with context and severity.';

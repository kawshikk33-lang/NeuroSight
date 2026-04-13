"""add alert_rules and alert_notifications tables

Revision ID: 0006_add_alerts
Revises: 0005_add_audit_logs
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_add_alerts"
down_revision = "0005_add_audit_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "alert_rules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("metric", sa.String(100), nullable=False),
        sa.Column("condition", sa.String(20), nullable=False),
        sa.Column("threshold_value", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("notification_type", sa.String(20), nullable=False, server_default=sa.text("'in_app'")),
        sa.Column("use_anomaly_detection", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("anomaly_std_devs", sa.Integer(), nullable=False, server_default=sa.text("3")),
        sa.Column("cooldown_seconds", sa.Integer(), nullable=False, server_default=sa.text("300")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_alert_rules_user_id", "alert_rules", ["user_id"], unique=False)
    op.create_index("ix_alert_rules_metric", "alert_rules", ["metric"], unique=False)
    op.create_index("ix_alert_rules_user_metric", "alert_rules", ["user_id", "metric"], unique=False)
    op.create_index("ix_alert_rules_active", "alert_rules", ["user_id", "is_active"], unique=False)

    op.create_table(
        "alert_notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_id", sa.String(36), sa.ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("metric", sa.String(100), nullable=False),
        sa.Column("current_value", sa.Float(), nullable=False),
        sa.Column("threshold_value", sa.Float(), nullable=True),
        sa.Column("condition", sa.String(20), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default=sa.text("'warning'")),
        sa.Column("trend", sa.String(50), nullable=True),
        sa.Column("recommended_action", sa.Text(), nullable=True),
        sa.Column("context", sa.String(2048), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_alert_notifications_user_id", "alert_notifications", ["user_id"], unique=False)
    op.create_index("ix_alert_notifications_rule_id", "alert_notifications", ["rule_id"], unique=False)
    op.create_index("ix_alert_notifications_is_read", "alert_notifications", ["is_read"], unique=False)
    op.create_index("ix_alert_notifications_user_read", "alert_notifications", ["user_id", "is_read"], unique=False)
    op.create_index("ix_alert_notifications_created", "alert_notifications", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_alert_notifications_created", table_name="alert_notifications")
    op.drop_index("ix_alert_notifications_user_read", table_name="alert_notifications")
    op.drop_index("ix_alert_notifications_is_read", table_name="alert_notifications")
    op.drop_index("ix_alert_notifications_rule_id", table_name="alert_notifications")
    op.drop_index("ix_alert_notifications_user_id", table_name="alert_notifications")
    op.drop_table("alert_notifications")

    op.drop_index("ix_alert_rules_active", table_name="alert_rules")
    op.drop_index("ix_alert_rules_user_metric", table_name="alert_rules")
    op.drop_index("ix_alert_rules_metric", table_name="alert_rules")
    op.drop_index("ix_alert_rules_user_id", table_name="alert_rules")
    op.drop_table("alert_rules")

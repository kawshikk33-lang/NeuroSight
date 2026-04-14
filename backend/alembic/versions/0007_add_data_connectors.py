"""add data_connectors table

Revision ID: 0007_add_data_connectors
Revises: 0006_add_alerts
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_add_data_connectors"
down_revision = "0006_add_alerts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "data_connectors",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("connector_type", sa.String(50), nullable=False),
        sa.Column("config", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'disconnected'")),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sync_frequency", sa.String(20), nullable=False, server_default=sa.text("'daily'")),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_data_connectors_user_id", "data_connectors", ["user_id"], unique=False)
    op.create_index("ix_data_connectors_type", "data_connectors", ["connector_type"], unique=False)
    op.create_index("ix_data_connectors_status", "data_connectors", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_data_connectors_status", table_name="data_connectors")
    op.drop_index("ix_data_connectors_type", table_name="data_connectors")
    op.drop_index("ix_data_connectors_user_id", table_name="data_connectors")
    op.drop_table("data_connectors")

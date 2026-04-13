"""add engineered features table

Revision ID: 0004_add_engineered_features
Revises: 0003_enable_supabase_rls_policies
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_add_engineered_features"
down_revision = "0003_enable_supabase_rls_policies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "engineered_features",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("formula", sa.String(length=1024), nullable=False),
        sa.Column("feature_type", sa.String(length=50), nullable=False, server_default="numeric"),
        sa.Column("description", sa.String(length=512), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_engineered_features_user_id", "engineered_features", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_engineered_features_user_id", table_name="engineered_features")
    op.drop_table("engineered_features")

"""add data files and analysis history

Revision ID: 0002_phase2_schema
Revises: 0001_init_users
Create Date: 2026-04-08
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_phase2_schema"
down_revision = "0001_init_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "data_files",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("storage_name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_data_files_user_id", "data_files", ["user_id"], unique=False)

    op.create_table(
        "analysis_history",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_id", sa.String(length=36), sa.ForeignKey("data_files.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("input_config", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("result_data", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_analysis_history_user_id", "analysis_history", ["user_id"], unique=False)
    op.create_index("ix_analysis_history_file_id", "analysis_history", ["file_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_analysis_history_file_id", table_name="analysis_history")
    op.drop_index("ix_analysis_history_user_id", table_name="analysis_history")
    op.drop_table("analysis_history")

    op.drop_index("ix_data_files_user_id", table_name="data_files")
    op.drop_table("data_files")

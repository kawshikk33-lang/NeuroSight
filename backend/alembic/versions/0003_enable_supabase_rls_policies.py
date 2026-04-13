"""enable supabase rls policies

Revision ID: 0003_supabase_rls
Revises: 0002_phase2_schema
Create Date: 2026-04-08
"""

from alembic import op


revision = "0003_supabase_rls"
down_revision = "0002_phase2_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Align with the design doc's Supabase RLS strategy.
    op.execute("ALTER TABLE data_files ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;")

    op.execute(
        """
        CREATE POLICY "Users can only view their own files" ON data_files
        FOR SELECT USING (auth.uid()::text = user_id::text);
        """
    )
    op.execute(
        """
        CREATE POLICY "Users can only view their own analysis" ON analysis_history
        FOR SELECT USING (auth.uid()::text = user_id::text);
        """
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute('DROP POLICY IF EXISTS "Users can only view their own analysis" ON analysis_history;')
    op.execute('DROP POLICY IF EXISTS "Users can only view their own files" ON data_files;')
    op.execute("ALTER TABLE analysis_history DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE data_files DISABLE ROW LEVEL SECURITY;")

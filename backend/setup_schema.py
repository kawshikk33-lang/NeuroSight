import os
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.czqvvhppzmkopbciezzh:z6ld1RfLvPLdGxvk@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

print("Connecting to Supabase...")
engine = create_engine(db_url)

with engine.connect() as conn:
    print("Renaming primary key constraint...")
    try:
        # In PostgreSQL, constraint names must be unique per schema.
        # When we renamed the table, the constraint kept the old name `alembic_version_pkc`.
        # This blocks MLflow from creating its own `alembic_version` table with the same constraint name.
        conn.execute(text("ALTER TABLE public.app_alembic_version RENAME CONSTRAINT alembic_version_pkc TO app_alembic_version_pkc;"))
        conn.commit()
        print("Constraint renamed successfully!")
    except Exception as e:
        print(f"Error (might already be renamed or missing): {e}")


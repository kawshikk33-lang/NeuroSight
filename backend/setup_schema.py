import os
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.czqvvhppzmkopbciezzh:z6ld1RfLvPLdGxvk@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"

print("Connecting to Supabase...")
engine = create_engine(db_url)

with engine.connect() as conn:
    print("Renaming alembic_version table...")
    # Since Alembic has already run for the app and created `alembic_version`,
    # we rename it to `app_alembic_version`.
    # We use IF EXISTS to avoid errors if ran multiple times.
    conn.execute(text("ALTER TABLE IF EXISTS public.alembic_version RENAME TO app_alembic_version;"))
    
    # If MLflow previously tried to use `mlflow` schema, let's keep it clean
    conn.execute(text("DROP SCHEMA IF EXISTS mlflow CASCADE;"))
    
    conn.commit()
    print("Successfully migrated Alembic tracking tables!")

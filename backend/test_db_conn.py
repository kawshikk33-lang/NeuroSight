import sys
import os

# Add the current directory to sys.path for app imports
sys.path.insert(0, os.path.abspath(os.curdir))

from sqlalchemy import create_engine, text
from app.core.config import settings

def test_connection():
    print(f"Testing connection to: {settings.database_url.split('@')[-1]}") # Hide credentials
    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            row = result.fetchone()
            print(f"✅ Connection successful!")
            print(f"PostgreSQL Version: {row[0]}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()

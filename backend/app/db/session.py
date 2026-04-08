from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Engine configuration optimized for remote PostgreSQL (Supabase)
connect_args = {}
if settings.database_url.startswith("postgresql"):
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.database_url, 
    pool_pre_ping=True,
    max_overflow=20,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

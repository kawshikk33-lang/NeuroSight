from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, get_password_hash, verify_password
from app.models.user import User


def ensure_seed_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == "admin@example.com").first()
    if existing:
        return
    user = User(
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("admin123"),
        role="admin",
    )
    db.add(user)
    db.commit()


def login(db: Session, email: str, password: str) -> dict[str, str]:
    ensure_seed_admin(db)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_token(
        email,
        timedelta(minutes=settings.access_token_expire_minutes),
        token_type="access",
    )
    refresh = create_token(
        email, timedelta(days=settings.refresh_token_expire_days), token_type="refresh"
    )
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


def register_user(db: Session, full_name: str, email: str, password: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=get_password_hash(password),
        role="viewer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

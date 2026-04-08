from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import login, register_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login_route(payload: LoginRequest, db: Session = Depends(get_db)):
    return login(db, payload.email, payload.password)


@router.post("/register", response_model=UserResponse)
def register_route(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, payload.full_name, payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh_route(payload: RefreshRequest):
    # Simplified refresh flow for scaffold; production should validate token store.
    return {"access_token": payload.refresh_token, "refresh_token": payload.refresh_token}


@router.get("/me", response_model=UserResponse)
def me_route(current_user=Depends(get_current_user)):
    return current_user

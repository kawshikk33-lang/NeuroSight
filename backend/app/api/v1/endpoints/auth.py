from fastapi import APIRouter, Depends
from fastapi import HTTPException
from httpx import HTTPStatusError
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
from app.services.supabase_client import supabase_client

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login_route(payload: LoginRequest, db: Session = Depends(get_db)):
    return await login(db, payload.email, payload.password)


@router.post("/register", response_model=UserResponse)
async def register_route(payload: RegisterRequest, db: Session = Depends(get_db)):
    return await register_user(db, payload.full_name, payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_route(payload: RefreshRequest):
    try:
        refreshed = await supabase_client.refresh_session(payload.refresh_token)
        return {
            "access_token": refreshed.get("access_token", ""),
            "refresh_token": refreshed.get("refresh_token", payload.refresh_token),
            "token_type": "bearer",
        }
    except HTTPStatusError as exc:
        raise HTTPException(status_code=401, detail=f"Refresh failed: {exc.response.text}") from exc


@router.get("/me", response_model=UserResponse)
def me_route(current_user=Depends(get_current_user)):
    return current_user

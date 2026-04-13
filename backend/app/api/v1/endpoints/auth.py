from fastapi import APIRouter, Depends, HTTPException, Request
from httpx import HTTPStatusError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.audit_logger import AuditLogger
from app.services.auth_service import login, register_user
from app.services.supabase_client import supabase_client

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login_route(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    result = await login(db, payload.email, payload.password)
    AuditLogger.log(
        db=db,
        request=request,
        event_type="login",
        action="execute",
        description=f"Login attempt for {payload.email}",
        resource_type="user",
        resource_name=payload.email,
        status_code=200,
        is_sensitive=True,
    )
    return result


@router.post("/register", response_model=UserResponse)
@limiter.limit("3/minute")
async def register_route(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    result = await register_user(db, payload.full_name, payload.email, payload.password)
    AuditLogger.log(
        db=db,
        request=request,
        event_type="register",
        action="create",
        description=f"New user registered: {payload.email}",
        resource_type="user",
        resource_name=payload.email,
        status_code=201,
        is_sensitive=True,
    )
    return result


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_route(request: Request, payload: RefreshRequest):
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

from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from httpx import HTTPStatusError
from app.models.user import User
from app.core.security import get_password_hash
from app.services.supabase_client import supabase_client


def _extract_http_error_detail(exc: HTTPStatusError) -> str:
    try:
        payload = exc.response.json()
        return payload.get("msg") or payload.get("error_description") or payload.get("error") or str(payload)
    except Exception:
        return exc.response.text or str(exc)


def _status_from_auth_error_detail(detail: str, default_status: int) -> int:
    lowered = detail.lower()
    if "rate limit" in lowered or "too many" in lowered:
        return 429
    if "invalid login credentials" in lowered:
        return 401
    if "already" in lowered and "register" in lowered:
        return 409
    return default_status

async def login(db: Session, email: str, password: str) -> dict:
    try:
        supabase_res = await supabase_client.sign_in(email, password)
        access_token = supabase_res.get("access_token")
        refresh_token = supabase_res.get("refresh_token")
        
        # Ensure user exists in local DB for roles/profiles
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # This case happens if user was created in Supabase manually
            user = User(
                email=email,
                full_name=email.split("@")[0],
                hashed_password=get_password_hash(password),
                role="viewer",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except HTTPStatusError as e:
        detail = _extract_http_error_detail(e)
        status_code = _status_from_auth_error_detail(detail, 401)
        raise HTTPException(status_code=status_code, detail=f"Authentication failed: {detail}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def register_user(db: Session, full_name: str, email: str, password: str) -> User:
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Registration failed: Email already registered")

        # Create user in Supabase as confirmed to allow immediate login.
        await supabase_client.create_user_admin(email, password, email_confirm=True)
        
        # Create local user record
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            role="viewer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed: Email already registered")
    except HTTPException:
        raise
    except HTTPStatusError as e:
        db.rollback()
        detail = _extract_http_error_detail(e)
        status_code = _status_from_auth_error_detail(detail, 400)
        raise HTTPException(status_code=status_code, detail=f"Registration failed: {detail}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

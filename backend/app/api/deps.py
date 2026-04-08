from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from httpx import HTTPStatusError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.services.supabase_client import supabase_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials"
    )
    try:
        # Validate token with Supabase directly to support current JWT signing modes.
        profile = await supabase_client.get_user(token)
        email = profile.get("email")
        if not email:
            raise credentials_exception
    except HTTPStatusError:
        raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

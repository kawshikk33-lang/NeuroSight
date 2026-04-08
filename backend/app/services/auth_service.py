from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.services.supabase_client import supabase_client

async def login(db: Session, email: str, password: str) -> dict:
    try:
        supabase_res = await supabase_client.sign_in(email, password)
        access_token = supabase_res.get("access_token")
        refresh_token = supabase_res.get("refresh_token")
        
        # Ensure user exists in local DB for roles/profiles
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # This case happens if user was created in Supabase manually
            user = User(email=email, full_name=email.split("@")[0], role="viewer")
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def register_user(db: Session, full_name: str, email: str, password: str) -> User:
    try:
        # Sign up in Supabase
        await supabase_client.sign_up(email, password)
        
        # Create local user record
        user = User(
            email=email,
            full_name=full_name,
            role="viewer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

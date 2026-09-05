from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user #, require_manager
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

def _set_auth_cookies(response: Response, user: User) -> None:
    response.set_cookie(
        key="access_token",
        value=create_access_token(
            user_id=user.user_id,
            role=user.role.value,
        ),
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    
    response.set_cookie(
        key="refresh_token",
        value=create_refresh_token(user_id=user.user_id),
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/",
    )

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    existing_user = db.scalar(
        select(User).where(User.email == data.email.lower())
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        role="TEAM_MEMBER",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):

    user = db.scalar(
        select(User).where(User.email == data.email.lower())
    )

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
        
    _set_auth_cookies(response, user)

    return {
        "message": "Login successful",
        "user": user,
    }

@router.post("/refresh", response_model=UserResponse)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
        
    try:
        payload = decode_refresh_token(refresh_token)
        user_id = int(payload["sub"])
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
        
    user = db.get(User, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
        
    _set_auth_cookies(response, user)

    return user

@router.post("/logout")
def logout(response: Response):
    
    for key in ("access_token", "refresh_token"):
        response.delete_cookie(
            key=key,
            httponly=True,
            samesite=settings.cookie_samesite,
            path="/",
        )

    return {
        "message": "Logout successful"
    }
    
@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user

"""  
@router.get("/manager-test")
def manager_test(
    current_user: User = Depends(require_manager),
):
    return {
        "message": "Manager access granted",
        "user": current_user.email,
    }
"""
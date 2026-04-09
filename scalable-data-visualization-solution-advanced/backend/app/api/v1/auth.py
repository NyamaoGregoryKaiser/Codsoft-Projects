```python
import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import router as user_router
from app.core.config import settings
from app.core.dependencies import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.crud.users import crud_user
from app.schemas.token import Token
from app.schemas.user import UserCreate, User

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login", response_model=Token, summary="Authenticate user and get JWT tokens")
async def login_access_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token and refresh token for future requests.
    Tokens are returned in the response body and also set as HTTP-only cookies.
    """
    user = await crud_user.get_by_email(db, email=form_data.username)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )
    # Correct authentication logic:
    from app.core.security import verify_password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
        )


    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id}, expires_delta=refresh_token_expires
    )

    # Set HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=access_token_expires.total_seconds(),
        expires=access_token_expires.total_seconds(),
        samesite="Lax", # "Strict", "Lax", "None" (requires Secure=True)
        secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https") # Set to True in production with HTTPS
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=refresh_token_expires.total_seconds(),
        expires=refresh_token_expires.total_seconds(),
        samesite="Lax",
        secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https")
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token, summary="Refresh JWT access token")
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Token:
    """
    Refresh the access token using a refresh token from HTTP-only cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(refresh_token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await crud_user.get(db, id=user_id)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        new_access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={"sub": user.id}, expires_delta=new_access_token_expires
        )

        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            max_age=new_access_token_expires.total_seconds(),
            expires=new_access_token_expires.total_seconds(),
            samesite="Lax",
            secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https")
        )
        return {"access_token": new_access_token, "token_type": "bearer"}

    except Exception as e:
        logger.error(f"Error refreshing token: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/logout", summary="Logout user and clear JWT cookies")
async def logout(response: Response):
    """
    Clear the access_token and refresh_token HTTP-only cookies.
    """
    response.delete_cookie(key="access_token", samesite="Lax", secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"))
    response.delete_cookie(key="refresh_token", samesite="Lax", secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"))
    return {"message": "Logged out successfully"}

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Register a new user. Default registered users are not superusers.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user_in.is_superuser = False # Ensure regular registration doesn't make superuser
    user = await crud_user.create(db, obj_in=user_in)
    return user

@router.get("/me", response_model=User, summary="Get current user details")
async def read_current_user(
    current_user: User = Depends(user_router.get_current_active_user), # Use dependency from users router
) -> User:
    """
    Get current active user.
    """
    return current_user
```
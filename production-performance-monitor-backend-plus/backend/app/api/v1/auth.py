from datetime import timedelta
from fastapi import APIRouter, Depends, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.database.session import get_db_session
from app.schemas.user import UserRegister, UserBase
from app.schemas.base import Token
from app.core.exceptions import HTTPException, UnauthorizedException
from app.services.auth_service import auth_service
from app.core.rate_limit import five_per_minute, one_per_second
from app.core.logging_config import logger


router = APIRouter()


@router.post("/register", response_model=UserBase, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(five_per_minute)])
async def register_user(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Register a new user.
    """
    logger.info(f"Attempting to register new user: {user_in.email}")
    try:
        user = await auth_service.register_user(db, user_in)
        logger.info(f"User {user.email} registered successfully with ID: {user.id}")
        return user
    except HTTPException as e:
        logger.warning(f"Registration failed for {user_in.email}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during registration for {user_in.email}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.post("/token", response_model=Token, dependencies=[Depends(five_per_minute)])
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Authenticate user and retrieve access and refresh tokens.
    """
    logger.info(f"Attempting to log in user: {form_data.username}")
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise UnauthorizedException("Incorrect email or password")

    access_token, refresh_token = await auth_service.create_tokens(user.id, user.email, user.is_admin)

    # Set refresh token as an HTTP-only cookie for better security
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES).total_seconds(),
        expires=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES).total_seconds(),
        # secure=True, # Enable in production with HTTPS
        # samesite="Lax" # Or "Strict" depending on needs
    )
    logger.info(f"User {user.email} logged in successfully.")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token, dependencies=[Depends(one_per_second)])
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Refresh access token using the refresh token from HTTP-only cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("Refresh token not found in cookies during refresh attempt.")
        raise UnauthorizedException("Refresh token missing")

    logger.info("Attempting to refresh access token.")
    try:
        new_access_token, new_refresh_token = await auth_service.refresh_access_token(db, refresh_token)
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            max_age=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES).total_seconds(),
            expires=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES).total_seconds(),
            # secure=True, # Enable in production with HTTPS
            # samesite="Lax"
        )
        logger.info("Access token refreshed successfully.")
        return {"access_token": new_access_token, "token_type": "bearer"}
    except UnauthorizedException as e:
        logger.warning(f"Token refresh failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.post("/logout")
async def logout(response: Response):
    """
    Logs out the user by clearing the refresh token cookie.
    """
    response.delete_cookie(key="refresh_token")
    logger.info("User logged out (refresh token cookie cleared).")
    return {"message": "Logged out successfully"}
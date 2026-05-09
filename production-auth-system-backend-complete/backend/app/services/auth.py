from datetime import datetime, timedelta, UTC
from typing import Optional, List
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.crud.users import user_crud
from app.crud.roles import role_crud
from app.crud.tokens import pwd_reset_token_crud, email_verify_token_crud
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token, UserReadPublic, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest
from app.schemas.token import PasswordResetTokenCreate, EmailVerificationTokenCreate
from app.utils.email_sender import email_sender
from app.utils.logger import logger

class AuthService:
    """
    Service layer for authentication related business logic.
    Handles user registration, login, token management, password reset, and email verification.
    """
    async def register_user(self, db: AsyncSession, user_data: UserCreate) -> User:
        """
        Registers a new user, assigns default roles, and sends a verification email.
        """
        existing_user = await user_crud.get_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        new_user = await user_crud.create_user(db, user_data)

        # Assign a default 'user' role to new users
        default_user_role = await role_crud.get_by_name(db, "user")
        if default_user_role:
            await user_crud.add_roles_to_user(db, new_user, [default_user_role])
            logger.info(f"User {new_user.email} registered and assigned 'user' role.")
        else:
            logger.warning("Default 'user' role not found, user registered without default role.")

        await self._send_verification_email(db, new_user)
        return new_user

    async def _send_verification_email(self, db: AsyncSession, user: User):
        """
        Generates and sends an email verification token.
        """
        token_str = str(uuid.uuid4())
        expires_at = datetime.now(UTC) + timedelta(hours=24) # 24 hours to verify
        token_create = EmailVerificationTokenCreate(
            token=token_str,
            user_id=user.id,
            expires_at=expires_at
        )
        await email_verify_token_crud.create_token(db, token_create)

        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token_str}"
        subject = "Verify Your Email Address"
        body = f"""
        Dear {user.full_name or user.email},

        Thank you for registering with our service.
        Please verify your email address by clicking on the link below:

        {verification_link}

        This link will expire in 24 hours.

        If you did not register for an account, please ignore this email.

        Sincerely,
        The {settings.PROJECT_NAME} Team
        """
        await email_sender.send_email(recipients=[user.email], subject=subject, body=body)
        logger.info(f"Verification email sent to {user.email}")

    async def verify_email(self, db: AsyncSession, verify_request: VerifyEmailRequest) -> User:
        """
        Verifies a user's email using a token.
        """
        token_obj = await email_verify_token_crud.get_by_token(db, verify_request.token)

        if not token_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

        user = await user_crud.get(db, token_obj.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found for token")
        if user.is_verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified")

        user.is_verified = True
        await user_crud.update(db, user, {"is_verified": True})
        await email_verify_token_crud.invalidate_token(db, token_obj) # Invalidate token after use
        logger.info(f"User {user.email} successfully verified their email.")
        return user

    async def authenticate_user(self, db: AsyncSession, user_data: UserLogin) -> User:
        """
        Authenticates a user by email and password.
        """
        user = await user_crud.get_by_email(db, user_data.email)
        if not user or not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    async def create_tokens(self, user: User) -> Token:
        """
        Generates access and refresh tokens for a user.
        """
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email to log in."
            )

        token_data = {"user_id": str(user.id), "email": user.email, "roles": [role.name for role in user.roles]}
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserReadPublic.model_validate(user)
        )

    async def refresh_access_token(self, db: AsyncSession, refresh_token: str, redis_client: Redis) -> Token:
        """
        Refreshes an access token using a valid refresh token.
        Also checks if the refresh token is blacklisted.
        """
        payload = decode_token(refresh_token)
        if payload is None or payload.get("sub") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        # Check if refresh token is blacklisted
        if await redis_client.get(f"blacklist:{refresh_token}"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked")

        user = await user_crud.get_with_roles(db, int(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

        # Re-issue both access and refresh tokens for better security (rotate refresh tokens)
        return await self.create_tokens(user)

    async def revoke_refresh_token(self, refresh_token: str, redis_client: Redis):
        """
        Blacklists a refresh token.
        """
        payload = decode_token(refresh_token)
        if payload is None or payload.get("sub") != "refresh":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid refresh token format")

        expires_at_timestamp = payload.get("exp")
        if not expires_at_timestamp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token has no expiry")

        expires_at = datetime.fromtimestamp(expires_at_timestamp, tz=UTC)
        ttl = (expires_at - datetime.now(UTC)).total_seconds()
        if ttl > 0:
            await redis_client.setex(f"blacklist:{refresh_token}", int(ttl), "true")
            logger.info(f"Refresh token blacklisted with TTL {ttl}s.")
        else:
            logger.info("Refresh token already expired, no need to blacklist.")


    async def forgot_password(self, db: AsyncSession, req: ForgotPasswordRequest):
        """
        Handles the forgot password request by sending a password reset email.
        """
        user = await user_crud.get_by_email(db, req.email)
        if not user:
            # For security, don't reveal if user exists or not.
            # Just log and return a success message.
            logger.info(f"Password reset request for non-existent email: {req.email}")
            return

        token_str = str(uuid.uuid4())
        expires_at = datetime.now(UTC) + timedelta(hours=1) # 1 hour to reset
        token_create = PasswordResetTokenCreate(
            token=token_str,
            user_id=user.id,
            expires_at=expires_at
        )
        await pwd_reset_token_crud.create_token(db, token_create)

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token_str}"
        subject = "Password Reset Request"
        body = f"""
        Dear {user.full_name or user.email},

        You have requested to reset your password.
        Please click on the link below to reset your password:

        {reset_link}

        This link will expire in 1 hour.

        If you did not request a password reset, please ignore this email.

        Sincerely,
        The {settings.PROJECT_NAME} Team
        """
        await email_sender.send_email(recipients=[user.email], subject=subject, body=body)
        logger.info(f"Password reset email sent to {user.email}")


    async def reset_password(self, db: AsyncSession, req: ResetPasswordRequest):
        """
        Resets a user's password using a valid token.
        """
        token_obj = await pwd_reset_token_crud.get_by_token(db, req.token)

        if not token_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset token")

        user = await user_crud.get(db, token_obj.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found for token")

        hashed_password = get_password_hash(req.new_password)
        await user_crud.update(db, user, {"hashed_password": hashed_password})
        await pwd_reset_token_crud.invalidate_token(db, token_obj) # Invalidate token after use
        logger.info(f"User {user.email} successfully reset their password.")

auth_service = AuthService()
```
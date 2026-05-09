from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, UTC

from app.crud.base import CRUDBase
from app.models.token import PasswordResetToken, EmailVerificationToken
from app.schemas.token import PasswordResetTokenCreate, EmailVerificationTokenCreate

class CRUDPasswordResetToken(CRUDBase[PasswordResetToken]):
    """
    CRUD operations for PasswordResetToken model.
    """
    async def create_token(self, db: AsyncSession, obj_in: PasswordResetTokenCreate) -> PasswordResetToken:
        """
        Creates a new password reset token.
        """
        return await self.create(db, obj_in.model_dump())

    async def get_by_token(self, db: AsyncSession, token: str) -> Optional[PasswordResetToken]:
        """
        Retrieves a password reset token by its string value.
        """
        stmt = select(self.model).where(
            self.model.token == token,
            self.model.expires_at > datetime.now(UTC),
            self.model.is_used == False # noqa: E712
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def invalidate_token(self, db: AsyncSession, token_obj: PasswordResetToken) -> PasswordResetToken:
        """
        Marks a password reset token as used.
        """
        token_obj.is_used = True
        db.add(token_obj)
        await db.commit()
        await db.refresh(token_obj)
        return token_obj

    async def clean_expired_and_used_tokens(self, db: AsyncSession):
        """
        Removes expired and used tokens from the database.
        """
        stmt = delete(self.model).where(
            (self.model.expires_at < datetime.now(UTC)) | (self.model.is_used == True) # noqa: E712
        )
        await db.execute(stmt)
        await db.commit()


class CRUDEmailVerificationToken(CRUDBase[EmailVerificationToken]):
    """
    CRUD operations for EmailVerificationToken model.
    """
    async def create_token(self, db: AsyncSession, obj_in: EmailVerificationTokenCreate) -> EmailVerificationToken:
        """
        Creates a new email verification token.
        """
        return await self.create(db, obj_in.model_dump())

    async def get_by_token(self, db: AsyncSession, token: str) -> Optional[EmailVerificationToken]:
        """
        Retrieves an email verification token by its string value.
        """
        stmt = select(self.model).where(
            self.model.token == token,
            self.model.expires_at > datetime.now(UTC),
            self.model.is_used == False # noqa: E712
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def invalidate_token(self, db: AsyncSession, token_obj: EmailVerificationToken) -> EmailVerificationToken:
        """
        Marks an email verification token as used.
        """
        token_obj.is_used = True
        db.add(token_obj)
        await db.commit()
        await db.refresh(token_obj)
        return token_obj

    async def clean_expired_and_used_tokens(self, db: AsyncSession):
        """
        Removes expired and used tokens from the database.
        """
        stmt = delete(self.model).where(
            (self.model.expires_at < datetime.now(UTC)) | (self.model.is_used == True) # noqa: E712
        )
        await db.execute(stmt)
        await db.commit()


pwd_reset_token_crud = CRUDPasswordResetToken(PasswordResetToken)
email_verify_token_crud = CRUDEmailVerificationToken(EmailVerificationToken)
```
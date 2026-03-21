```python
from sqlalchemy.orm import Session
from backend.core.security import get_password_hash, verify_password, create_access_token
from backend.models import User as DBUser
from backend.schemas.user import UserCreate
from backend.schemas.auth import LoginRequest, Token
from backend.core.exception_handlers import UserAlreadyExistsError, UnauthorizedAccessError
from datetime import timedelta
from backend.core.config import settings

class AuthService:
    def register_user(self, db: Session, user_data: UserCreate) -> DBUser:
        db_user = db.query(DBUser).filter(DBUser.email == user_data.email).first()
        if db_user:
            raise UserAlreadyExistsError()

        hashed_password = get_password_hash(user_data.password)
        db_user = DBUser(
            email=user_data.email,
            hashed_password=hashed_password,
            is_active=user_data.is_active,
            is_superuser=user_data.is_superuser
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def authenticate_user(self, db: Session, login_data: LoginRequest) -> DBUser:
        user = db.query(DBUser).filter(DBUser.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise UnauthorizedAccessError("Incorrect email or password")
        if not user.is_active:
            raise UnauthorizedAccessError("Inactive user")
        return user

    def create_token_for_user(self, user: DBUser) -> Token:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token)
```
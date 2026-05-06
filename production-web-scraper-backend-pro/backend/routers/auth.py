```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.core.database import get_db
from backend.core.config import settings
from backend.core.dependencies import get_current_user
from backend.services import crud, security
from backend.schemas.user import UserCreate, UserInDB
from backend.schemas.auth import RegisterRequest, AuthResponse, Token, TokenData, LoginRequest
from backend.models.user import User
from backend.core.logger import logger

router = APIRouter()

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = security.get_password_hash(user_in.password)
    new_user_create = UserCreate(
        username=user_in.username,
        email=user_in.email,
        password=user_in.password # password field in schema is just for validation, will be hashed
    )
    user = crud.user.create(db, new_user_create, hashed_password=hashed_password)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "id": user.id, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )
    logger.info(f"User {user.username} registered successfully.")
    return AuthResponse(
        user=UserInDB.model_validate(user),
        token=Token(access_token=access_token, token_type="bearer", expires_in=int(access_token_expires.total_seconds()))
    )

@router.post("/login", response_model=AuthResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Login and get an access token (for OAuth2 compatible clients).
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "id": user.id, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )
    logger.info(f"User {user.username} logged in successfully via OAuth2.")
    return AuthResponse(
        user=UserInDB.model_validate(user),
        token=Token(access_token=access_token, token_type="bearer", expires_in=int(access_token_expires.total_seconds()))
    )

@router.post("/login_json", response_model=AuthResponse)
async def login_for_access_token_json(
    login_data: LoginRequest, db: Session = Depends(get_db)
):
    """
    Login with JSON payload and get an access token.
    """
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "id": user.id, "is_admin": user.is_admin},
        expires_delta=access_token_expires
    )
    logger.info(f"User {user.username} logged in successfully via JSON.")
    return AuthResponse(
        user=UserInDB.model_validate(user),
        token=Token(access_token=access_token, token_type="bearer", expires_in=int(access_token_expires.total_seconds()))
    )


@router.get("/me", response_model=UserInDB)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user.
    """
    return UserInDB.model_validate(current_user)
```
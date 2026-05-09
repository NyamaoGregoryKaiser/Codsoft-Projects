```python
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.dependencies import get_db
from app.crud.user import crud_user
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserPublic
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = crud_user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"User {user.email} logged in successfully.")
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
):
    """
    Register a new user.
    """
    user = crud_user.get_by_email(db, email=user_in.email)
    if user:
        logger.warning(f"Attempted registration with existing email: {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    user = crud_user.create(db, obj_in=user_in)
    logger.info(f"New user registered: {user.email}")
    return user

```
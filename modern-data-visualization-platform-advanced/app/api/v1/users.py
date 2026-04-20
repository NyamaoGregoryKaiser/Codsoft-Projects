from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.datasets import router as datasets_router # For routing consistency

from app.schemas.user import User, UserCreate, UserUpdate, UserLogin
from app.schemas.token import Token
from app.crud.user import user as crud_user
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user, get_current_active_superuser
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.exceptions import HTTPException
from app.utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/users", tags=["Users & Auth"])

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Register a new user.
    """
    db_user = await crud_user.get_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"User registered: {user.email}")
    return user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Authenticate user and get access token.
    """
    user = await crud_user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    access_token = create_access_token(data={"sub": user.id})
    logger.info(f"User logged in: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get current authenticated user's details.
    """
    return current_user

@router.put("/me", response_model=User)
async def update_users_me(
    user_in: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update current authenticated user's details.
    """
    user = await crud_user.update(db, db_obj=current_user, obj_in=user_in)
    logger.info(f"User {user.email} updated their profile.")
    return user

# Admin operations
@router.get("/", response_model=list[User])
async def read_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_superuser)],
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve all users (superuser only).
    """
    users = await crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_superuser)]
):
    """
    Create a new user by a superuser.
    """
    db_user = await crud_user.get_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"Admin {current_user.email} created user: {user.email}")
    return user

@router.get("/{user_id}", response_model=User)
async def read_user_by_id(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_superuser)]
):
    """
    Retrieve a specific user by ID (superuser only).
    """
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=User)
async def update_user_by_admin(
    user_id: int,
    user_in: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_superuser)]
):
    """
    Update a user by ID (superuser only).
    """
    db_user = await crud_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    user = await crud_user.update(db, db_obj=db_user, obj_in=user_in)
    logger.info(f"Admin {current_user.email} updated user: {user.email}")
    return user

@router.delete("/{user_id}", response_model=User)
async def delete_user_by_admin(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_superuser)]
):
    """
    Delete a user by ID (superuser only).
    """
    user = await crud_user.delete(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    logger.info(f"Admin {current_user.email} deleted user: {user.email}")
    return user
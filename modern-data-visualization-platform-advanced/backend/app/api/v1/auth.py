```python
import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.crud.users import crud_user
from app.schemas.token import Token
from app.schemas.user import UserCreate, User
from app.schemas.msg import Msg
from app.core.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/login/access-token", response_model=Token, summary="Obtain JWT Access Token")
@rate_limit(settings.RATE_LIMIT_DEFAULT) # Apply rate limiting to login attempts
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud_user.get_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        logger.warning(f"Attempted login by inactive user: {user.email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    logger.info(f"User {user.email} successfully logged in.")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/test-token", response_model=User, summary="Test current token validity")
async def test_token(current_user: User = Depends(deps.get_current_active_user)) -> User:
    """
    Test access token
    """
    return current_user

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED, summary="Register a new user")
@rate_limit(settings.RATE_LIMIT_DEFAULT)
async def register_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
    # Allow registration without superuser check, but default to non-superuser
    # If only admin can register new users, add: current_user: User = Depends(deps.get_current_active_superuser)
) -> User:
    """
    Register a new user. Default to non-superuser unless modified by an admin.
    """
    user = await crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    
    # Ensure regular users cannot register as superusers directly
    if user_in.is_superuser:
        logger.warning(f"Attempted to register superuser by non-admin: {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to register as a superuser. Please contact an administrator.",
        )
    
    user_in.is_superuser = False # Explicitly set to false for registration endpoint
    new_user = await crud_user.create(db, obj_in=user_in)
    logger.info(f"New user registered: {new_user.email}")
    return new_user

# Example of a password recovery endpoint (conceptual, actual implementation depends on email service)
@router.post("/recover-password/{email}", response_model=Msg, summary="Request password recovery email")
@rate_limit(settings.RATE_LIMIT_DEFAULT)
async def recover_password(email: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(deps.get_db)) -> Msg:
    """
    Password recovery
    """
    user = await crud_user.get_by_email(db, email=email)
    if not user:
        # Avoid giving away whether email exists for security reasons
        logger.warning(f"Password recovery requested for non-existent email: {email}")
        return {"msg": "Password recovery email sent (if user exists)."}

    # In a real application, you would generate a secure token,
    # save it to the DB with an expiry, and send it via email.
    # For this example, we'll just log it.
    reset_token = "some_secure_generated_token_here" # Implement actual token generation
    logger.info(f"Generated password reset token for {email}: {reset_token}")

    # You would typically add an email sending task to background_tasks
    # background_tasks.add_task(send_recovery_email, user.email, reset_token)
    
    return {"msg": "Password recovery email sent (if user exists)."}

# Example of a reset password endpoint
@router.post("/reset-password/", response_model=Msg, summary="Reset password using recovery token")
@rate_limit(settings.RATE_LIMIT_DEFAULT)
async def reset_password(
    token: str, new_password: str = Depends(deps.validate_password), db: AsyncSession = Depends(deps.get_db)
) -> Msg:
    """
    Reset password with a valid token.
    """
    # In a real app, you would validate the token, find the user, and then update their password
    # For now, this is a placeholder.
    if token == "some_secure_generated_token_here": # Placeholder check
        # user = await crud_user.get_by_reset_token(db, token=token)
        # if not user:
        #    raise HTTPException(status_code=400, detail="Invalid or expired token.")
        
        # user_update = UserUpdate(password=new_password)
        # await crud_user.update(db, db_obj=user, obj_in=user_update)
        logger.info("Password reset successfully (placeholder).")
        return {"msg": "Password updated successfully."}
    
    raise HTTPException(status_code=400, detail="Invalid or expired token.")
```
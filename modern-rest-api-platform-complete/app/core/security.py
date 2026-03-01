from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from passlib.context import CryptContext
from jose import jwt, JWTError

from app.core.config import settings
from app.core.exceptions import CredentialException

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "sub": "access"})
    encoded_jwt = jwt.encode(to_encode, str(settings.SECRET_KEY), algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes a JWT access token."""
    try:
        payload = jwt.decode(token, str(settings.SECRET_KEY), algorithms=[settings.ALGORITHM])
        if payload.get("sub") != "access":
            raise CredentialException(detail="Invalid token type.")
        return payload
    except JWTError:
        raise CredentialException(detail="Could not validate credentials.")
    except Exception:
        raise CredentialException(detail="Invalid token.")
```
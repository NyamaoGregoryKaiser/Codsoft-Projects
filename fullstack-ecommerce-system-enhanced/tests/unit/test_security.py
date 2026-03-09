```python
from datetime import timedelta, datetime
import pytest
from jose import jwt, JWTError

from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.config import settings
from app.schemas.token import TokenData

def test_password_hashing():
    """Test password hashing and verification."""
    password = "mysecretpassword"
    hashed_password = get_password_hash(password)
    
    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("wrongpassword", hashed_password)

def test_create_access_token():
    """Test access token creation and payload."""
    data = {"sub": "test@example.com", "user_id": 1, "is_admin": False}
    token = create_access_token(data)
    
    assert isinstance(token, str)
    assert len(token) > 0

    decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded_data["sub"] == data["sub"]
    assert decoded_data["user_id"] == data["user_id"]
    assert decoded_data["is_admin"] == data["is_admin"]
    assert "exp" in decoded_data

def test_create_access_token_with_custom_expiry():
    """Test access token creation with a custom expiry time."""
    data = {"sub": "test@example.com", "user_id": 1, "is_admin": False}
    custom_expiry = timedelta(minutes=1)
    token = create_access_token(data, expires_delta=custom_expiry)
    
    decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    exp_time = datetime.fromtimestamp(decoded_data["exp"])
    # Allow for small discrepancies due to processing time
    assert datetime.utcnow() + timedelta(seconds=59) <= exp_time <= datetime.utcnow() + timedelta(seconds=61)

def test_decode_token_valid():
    """Test decoding a valid token."""
    data = {"sub": "test@example.com", "user_id": 1, "is_admin": True}
    token = create_access_token(data)
    
    token_data = decode_token(token)
    assert token_data.email == data["sub"]
    assert token_data.user_id == data["user_id"]
    assert token_data.is_admin == data["is_admin"]

def test_decode_token_invalid_signature():
    """Test decoding a token with an invalid signature."""
    data = {"sub": "test@example.com", "user_id": 1}
    # Create token with a different secret key
    wrong_secret = "wrong_secret_key"
    token = jwt.encode(data, wrong_secret, algorithm=settings.ALGORITHM)
    
    with pytest.raises(JWTError, match="Could not validate credentials"):
        decode_token(token)

def test_decode_token_expired():
    """Test decoding an expired token."""
    data = {"sub": "test@example.com", "user_id": 1}
    # Create an expired token
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    
    with pytest.raises(JWTError, match="Could not validate credentials"):
        decode_token(expired_token)

def test_decode_token_missing_payload_data():
    """Test decoding a token with missing required payload."""
    data = {"not_sub": "test", "not_user_id": 1} # Missing 'sub' and 'user_id'
    token = create_access_token(data)
    
    with pytest.raises(JWTError, match="Could not validate credentials"):
        decode_token(token)

```
```python
import pytest
from datetime import timedelta
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.config import settings
from app.core.exceptions import UnauthorizedException

def test_password_hashing():
    password = "testpassword123"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password)
    assert not verify_password("wrongpassword", hashed_password)

def test_create_access_token():
    user_id = 1
    token = create_access_token({"sub": user_id})
    assert isinstance(token, str)
    assert len(token) > 0

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert "exp" in payload

def test_create_access_token_with_custom_expiry():
    user_id = 2
    expires_delta = timedelta(minutes=10)
    token = create_access_token({"sub": user_id}, expires_delta=expires_delta)

    payload = decode_token(token)
    assert payload["sub"] == user_id
    # Check if expiration is roughly within delta
    assert payload["exp"] - (payload["exp"] - settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60) < expires_delta.total_seconds() + 5 # Small buffer

def test_decode_invalid_token():
    with pytest.raises(UnauthorizedException, match="Could not validate credentials"):
        decode_token("invalid.jwt.token")

def test_decode_expired_token():
    user_id = 3
    expired_token = create_access_token({"sub": user_id}, expires_delta=timedelta(minutes=-1)) # 1 minute in the past
    with pytest.raises(UnauthorizedException, match="Could not validate credentials"):
        decode_token(expired_token)
```
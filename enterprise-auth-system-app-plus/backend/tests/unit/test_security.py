```python
import pytest
from datetime import datetime, timedelta, timezone
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.config import settings

def test_password_hashing():
    password = "secure_password_123"
    hashed_password = get_password_hash(password)
    assert isinstance(hashed_password, str)
    assert len(hashed_password) > 0
    assert hashed_password != password # Should not be plain text

def test_password_verification():
    password = "another_secure_password"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password)
    assert not verify_password("wrong_password", hashed_password)

def test_access_token_creation():
    user_data = {"sub": "123", "is_refresh_token": False}
    token = create_access_token(user_data)
    assert isinstance(token, str)
    assert len(token) > 0

def test_access_token_decoding():
    user_id = 456
    user_data = {"sub": str(user_id), "is_refresh_token": False}
    token = create_access_token(user_data, expires_delta=timedelta(minutes=5))
    
    decoded_payload = decode_token(token)
    assert decoded_payload is not None
    assert decoded_payload["sub"] == str(user_id)
    assert not decoded_payload["is_refresh_token"]
    assert "exp" in decoded_payload
    
    # Check expiration is in the future
    exp_time = datetime.fromtimestamp(decoded_payload["exp"], tz=timezone.utc)
    assert exp_time > datetime.now(timezone.utc)

def test_expired_token_decoding():
    user_data = {"sub": "789", "is_refresh_token": False}
    # Create a token that expires immediately
    token = create_access_token(user_data, expires_delta=timedelta(seconds=-1))
    
    # Give a small delay to ensure token is truly expired
    import time
    time.sleep(1)

    decoded_payload = decode_token(token)
    assert decoded_payload is None # Should be None for expired token

def test_invalid_secret_key_token_decoding():
    user_data = {"sub": "101", "is_refresh_token": False}
    # Temporarily change the secret key to create a "tampered" token
    original_secret_key = settings.SECRET_KEY
    settings.SECRET_KEY = "DIFFERENT_SECRET_KEY"
    invalid_token = create_access_token(user_data)
    settings.SECRET_KEY = original_secret_key # Restore original
    
    decoded_payload = decode_token(invalid_token)
    assert decoded_payload is None # Should be None for invalid signature

def test_refresh_token_creation_and_decoding():
    user_id = 1
    user_data = {"sub": str(user_id), "is_refresh_token": True}
    token = create_access_token(user_data, expires_delta=timedelta(hours=1)) # Using create_access_token for simplicity, it handles the logic for different expiry
    
    decoded_payload = decode_token(token)
    assert decoded_payload is not None
    assert decoded_payload["sub"] == str(user_id)
    assert decoded_payload["is_refresh_token"]
    
    # Check expiration is in the future
    exp_time = datetime.fromtimestamp(decoded_payload["exp"], tz=timezone.utc)
    assert exp_time > datetime.now(timezone.utc)

```
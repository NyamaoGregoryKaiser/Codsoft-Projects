```python
import pytest
from datetime import datetime, timedelta
from jose import jwt

from app.core.security import create_access_token, verify_password, get_password_hash, ALGORITHM
from app.core.config import settings

def test_get_password_hash():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert isinstance(hashed_password, str)
    assert hashed_password != password # Ensure it's hashed

def test_verify_password():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password) is True
    assert verify_password("wrongpassword", hashed_password) is False

def test_create_access_token():
    test_data = {"sub": "test@example.com"}
    token = create_access_token(test_data)
    assert isinstance(token, str)

    decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded_token["sub"] == test_data["sub"]
    assert "exp" in decoded_token
    assert "iat" in decoded_token

def test_create_access_token_with_expires_delta():
    test_data = {"sub": "test@example.com"}
    expires_delta = timedelta(minutes=10)
    token = create_access_token(test_data, expires_delta=expires_delta)

    decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    
    # Check expiry is approximately correct
    expected_exp_min = datetime.utcnow() + expires_delta
    # Allow a small margin of error (e.g., 2 seconds)
    assert decoded_token["exp"] < (expected_exp_min + timedelta(seconds=2)).timestamp()
    assert decoded_token["exp"] > (expected_exp_min - timedelta(seconds=2)).timestamp()

```
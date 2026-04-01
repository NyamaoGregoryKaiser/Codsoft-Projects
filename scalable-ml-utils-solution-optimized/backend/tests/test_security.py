```python
import pytest
from datetime import datetime, timedelta
from backend.app.auth.security import verify_password, get_password_hash, create_access_token, decode_access_token
from backend.app.core.config import settings
from backend.app.core.exceptions import UnauthorizedException
from backend.app.schemas.token import TokenPayload
from jose import jwt

def test_verify_password():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password)
    assert not verify_password("wrongpassword", hashed_password)

def test_get_password_hash():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert isinstance(hashed_password, str)
    assert len(hashed_password) > 0
    assert hashed_password.startswith("$2b$") # bcrypt hash format

def test_create_access_token():
    user_id = 1
    token = create_access_token({"user_id": user_id})
    assert isinstance(token, str)
    assert len(token) > 0

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == str(user_id)
    assert "exp" in payload

def test_create_access_token_with_expiry():
    user_id = 1
    expires_delta = timedelta(minutes=5)
    token = create_access_token({"user_id": user_id}, expires_delta=expires_delta)
    
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == str(user_id)
    
    # Check if expiration is roughly as expected (allowing for small time discrepancies)
    expected_exp = datetime.utcnow() + expires_delta
    assert expected_exp.timestamp() - 10 <= payload["exp"] <= expected_exp.timestamp() + 10

def test_decode_access_token():
    user_id = 1
    token = create_access_token({"user_id": user_id})
    token_data = decode_access_token(token)
    assert token_data.sub == user_id

def test_decode_access_token_expired():
    user_id = 1
    # Create an immediately expired token
    expired_token = create_access_token({"user_id": user_id}, expires_delta=timedelta(minutes=-1))
    
    with pytest.raises(UnauthorizedException) as excinfo:
        decode_access_token(expired_token)
    assert "Could not validate credentials" in str(excinfo.value.detail)

def test_decode_access_token_invalid_signature():
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature"
    with pytest.raises(UnauthorizedException) as excinfo:
        decode_access_token(token)
    assert "Could not validate credentials" in str(excinfo.value.detail)

def test_decode_access_token_missing_sub():
    # Create a token without 'sub' claim
    token_data = {"exp": datetime.utcnow() + timedelta(minutes=5)}
    token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(UnauthorizedException) as excinfo:
        decode_access_token(token)
    assert "Could not validate credentials" in str(excinfo.value.detail)
```
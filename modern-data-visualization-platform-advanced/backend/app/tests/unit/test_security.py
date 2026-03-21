```python
import pytest
from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.core.security import create_access_token, verify_password, get_password_hash, decode_access_token, ALGORITHM
from app.core.config import settings

def test_password_hashing():
    password = "MyStrongPassword123!"
    hashed_password = get_password_hash(password)
    assert isinstance(hashed_password, str)
    assert len(hashed_password) > 10 # bcrypt hashes are quite long
    assert hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")

def test_password_verification():
    password = "MyStrongPassword123!"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password) is True
    assert verify_password("wrong_password", hashed_password) is False

def test_create_access_token_default_expiry():
    data = {"sub": "1"}
    token = create_access_token(data)
    
    # Decode to check payload and expiry
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "1"
    
    # Check if expiry is roughly correct
    expected_expiry = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    assert expected_expiry - timedelta(seconds=5) < datetime.fromtimestamp(payload["exp"]) < expected_expiry + timedelta(seconds=5)

def test_create_access_token_custom_expiry():
    data = {"sub": "2"}
    custom_delta = timedelta(minutes=10)
    token = create_access_token(data, expires_delta=custom_delta)

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "2"

    expected_expiry = datetime.utcnow() + custom_delta
    assert expected_expiry - timedelta(seconds=5) < datetime.fromtimestamp(payload["exp"]) < expected_expiry + timedelta(seconds=5)

def test_decode_access_token_valid():
    data = {"sub": "3", "custom_field": "value"}
    token = create_access_token(data)
    decoded_payload = decode_access_token(token)
    assert decoded_payload is not None
    assert decoded_payload["sub"] == "3"
    assert decoded_payload["custom_field"] == "value"

def test_decode_access_token_expired():
    data = {"sub": "4"}
    # Create a token that expires immediately
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    
    # Wait a bit to ensure it's expired
    import time
    time.sleep(1)

    decoded_payload = decode_access_token(token)
    assert decoded_payload is None # Should return None if expired

def test_decode_access_token_invalid_signature():
    data = {"sub": "5"}
    token = create_access_token(data)
    
    # Tamper with the token (change secret key)
    invalid_token_payload = jwt.decode(token, "wrong_secret_key", algorithms=[ALGORITHM], options={"verify_signature": False})
    tampered_token = jwt.encode(invalid_token_payload, "another_wrong_key", algorithm=ALGORITHM)

    decoded_payload = decode_access_token(tampered_token)
    assert decoded_payload is None # Should return None due to invalid signature

def test_decode_access_token_malformed():
    malformed_token = "invalid.jwt.token"
    decoded_payload = decode_access_token(malformed_token)
    assert decoded_payload is None

```
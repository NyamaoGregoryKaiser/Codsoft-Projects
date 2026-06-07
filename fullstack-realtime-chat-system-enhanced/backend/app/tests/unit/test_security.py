```python
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.config import settings

def test_password_hashing():
    """
    Test password hashing and verification.
    """
    password = "mysecretpassword"
    hashed_password = get_password_hash(password)
    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("wrongpassword", hashed_password)

def test_create_access_token():
    """
    Test access token creation.
    """
    user_id = 1
    token = create_access_token(data={"sub": user_id})
    assert isinstance(token, str)
    assert len(token) > 0

    # Test with custom expiry
    custom_expiry = timedelta(minutes=1)
    token_custom = create_access_token(data={"sub": user_id}, expires_delta=custom_expiry)
    payload_custom = jwt.decode(token_custom, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload_custom["sub"] == user_id
    # Check if expiration is roughly correct (within a few seconds)
    expected_exp = datetime.now(timezone.utc) + custom_expiry
    assert expected_exp.timestamp() - payload_custom["exp"] < 5 # Allow small delta

def test_decode_access_token_valid():
    """
    Test decoding a valid access token.
    """
    user_id = 1
    token = create_access_token(data={"sub": user_id})
    payload = decode_access_token(token)
    assert payload["sub"] == user_id
    assert "exp" in payload
    assert "iat" in payload

def test_decode_access_token_invalid_signature():
    """
    Test decoding a token with an invalid signature.
    """
    user_id = 1
    token = create_access_token(data={"sub": user_id})
    invalid_token = token + "invalid" # Tamper with the token

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(invalid_token)
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate credentials"

def test_decode_access_token_expired():
    """
    Test decoding an expired access token.
    """
    user_id = 1
    expired_token = create_access_token(data={"sub": user_id}, expires_delta=timedelta(seconds=-1)) # Expired 1 second ago

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(expired_token)
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate credentials"

def test_decode_access_token_missing_sub():
    """
    Test decoding a token that lacks the 'sub' field.
    """
    token = create_access_token(data={"foo": "bar"}) # No 'sub' field

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate credentials"

def test_decode_access_token_wrong_algorithm():
    """
    Test decoding a token with the wrong algorithm.
    """
    payload = {"sub": 1, "exp": (datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()}
    wrong_algo_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS512") # Use different algorithm

    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(wrong_algo_token)
    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Could not validate credentials"

```
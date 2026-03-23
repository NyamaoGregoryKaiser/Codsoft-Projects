from datetime import datetime, timedelta, timezone
import pytest
from jose import jwt, JWTError
from app.core import security
from app.core.config import settings
from app.core.exceptions import UnauthorizedException

def test_verify_password():
    password = "mysecretpassword"
    hashed_password = security.get_password_hash(password)
    assert security.verify_password(password, hashed_password)
    assert not security.verify_password("wrongpassword", hashed_password)

def test_get_password_hash():
    password = "mysecretpassword"
    hashed_password = security.get_password_hash(password)
    assert isinstance(hashed_password, str)
    assert len(hashed_password) > 0
    # Hashes should be different for same password due to salt
    assert security.get_password_hash(password) != hashed_password

def test_create_access_token():
    data = {"sub": 123}
    token = security.create_access_token(data)
    assert isinstance(token, str)
    assert len(token) > 0

    # Test with custom expiry
    expires_delta = timedelta(minutes=60)
    token_custom_expiry = security.create_access_token(data, expires_delta=expires_delta)
    decoded_payload = jwt.decode(token_custom_expiry, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded_payload["sub"] == 123
    assert "exp" in decoded_payload
    # Check expiry is roughly 60 mins from now
    expected_exp = datetime.now(timezone.utc) + expires_delta
    assert decoded_payload["exp"] > (expected_exp - timedelta(minutes=1)).timestamp()
    assert decoded_payload["exp"] < (expected_exp + timedelta(minutes=1)).timestamp()

def test_decode_access_token_valid():
    user_id = 456
    token = security.create_access_token(data={"sub": user_id})
    payload = security.decode_access_token(token)
    assert payload["sub"] == user_id
    assert "exp" in payload

def test_decode_access_token_invalid():
    with pytest.raises(UnauthorizedException, match="Could not validate credentials"):
        security.decode_access_token("invalid_token")

def test_decode_access_token_expired():
    # Create a token that expires immediately
    expires_delta = timedelta(seconds=-1)
    token = security.create_access_token(data={"sub": 789}, expires_delta=expires_delta)

    # Introduce a small delay to ensure token is expired
    import time
    time.sleep(0.1)

    with pytest.raises(UnauthorizedException, match="Could not validate credentials"):
        security.decode_access_token(token)

def test_decode_access_token_wrong_secret():
    data = {"sub": 101}
    # Manually create a token with a different secret key
    wrong_secret = "wrong-secret-key"
    token = jwt.encode(
        {"sub": data["sub"], "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        wrong_secret,
        algorithm=settings.ALGORITHM
    )

    with pytest.raises(UnauthorizedException, match="Could not validate credentials"):
        security.decode_access_token(token)
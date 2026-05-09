from datetime import datetime, timedelta, UTC
import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings

@pytest.fixture(autouse=True)
def set_test_settings():
    """Ensure settings are configured for testing."""
    settings.SECRET_KEY = "test-secret-key-very-secure-for-testing-purposes"
    settings.ALGORITHM = "HS256"
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = 1
    settings.REFRESH_TOKEN_EXPIRE_DAYS = 7

def test_password_hashing():
    """
    Test password hashing and verification.
    """
    password = "MySuperSecretPassword123!"
    hashed_password = get_password_hash(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("WrongPassword", hashed_password)

def test_create_access_token():
    """
    Test access token creation and decoding.
    """
    data = {"user_id": "1", "email": "test@example.com", "roles": ["user"]}
    token = create_access_token(data)
    assert isinstance(token, str)

    payload = decode_token(token)
    assert payload is not None
    assert payload["user_id"] == "1"
    assert payload["email"] == "test@example.com"
    assert payload["roles"] == ["user"]
    assert payload["sub"] == "access"
    assert "exp" in payload

def test_create_access_token_with_custom_expiry():
    """
    Test access token with custom expiry.
    """
    data = {"user_id": "2", "email": "custom@example.com"}
    expires_delta = timedelta(minutes=5)
    token = create_access_token(data, expires_delta=expires_delta)

    payload = decode_token(token)
    assert payload is not None
    exp_time = datetime.fromtimestamp(payload["exp"], tz=UTC)
    assert (exp_time - datetime.now(UTC)).total_seconds() > (expires_delta.total_seconds() - 10) # allow for small time delta

def test_create_refresh_token():
    """
    Test refresh token creation and decoding.
    """
    data = {"user_id": "3", "email": "refresh@example.com"}
    token = create_refresh_token(data)
    assert isinstance(token, str)

    payload = decode_token(token)
    assert payload is not None
    assert payload["user_id"] == "3"
    assert payload["email"] == "refresh@example.com"
    assert payload["sub"] == "refresh"
    assert "exp" in payload

def test_decode_invalid_token():
    """
    Test decoding an invalid token.
    """
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    payload = decode_token(invalid_token)
    assert payload is None

def test_decode_expired_token():
    """
    Test decoding an expired token.
    """
    data = {"user_id": "4", "email": "expired@example.com"}
    # Create a token that expires very quickly
    token = create_access_token(data, expires_delta=timedelta(seconds=-1)) # Expired 1 second ago
    
    # Wait for a moment to ensure it's truly expired if system clock is very fast
    import time
    time.sleep(1.1)

    payload = decode_token(token)
    assert payload is None

def test_decode_token_with_wrong_algorithm():
    """
    Test decoding a token with a mismatched algorithm.
    """
    data = {"user_id": "5", "email": "wrongalgo@example.com"}
    # Manually encode with a different algorithm
    wrong_algo_token = jwt.encode(data, settings.SECRET_KEY, algorithm="HS512")
    
    payload = decode_token(wrong_algo_token) # decode_token uses settings.ALGORITHM (HS256)
    assert payload is None

def test_decode_token_with_wrong_secret():
    """
    Test decoding a token with a wrong secret key.
    """
    data = {"user_id": "6", "email": "wrongsecret@example.com"}
    token = create_access_token(data)

    original_secret_key = settings.SECRET_KEY
    settings.SECRET_KEY = "another-wrong-secret-key-for-testing"
    
    payload = decode_token(token)
    assert payload is None
    
    settings.SECRET_KEY = original_secret_key # Restore original
```
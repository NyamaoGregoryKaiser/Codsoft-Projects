from datetime import timedelta, datetime, timezone
import pytest
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    verify_password_reset_token,
    create_email_verification_token,
    verify_email_verification_token
)
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from jose import jwt, JWTError

def test_password_hashing():
    password = "testpassword123"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password)
    assert not verify_password("wrongpassword", hashed_password)

def test_create_access_token():
    data = {"user_id": 123}
    token = create_access_token(data)
    assert isinstance(token, str)

    # Decode and check payload
    decoded_payload = decode_token(token)
    assert decoded_payload["user_id"] == 123
    assert decoded_payload["sub"] == "access"
    assert "exp" in decoded_payload

def test_create_refresh_token():
    data = {"user_id": 123, "jti": "some_unique_id"}
    token = create_refresh_token(data)
    assert isinstance(token, str)

    # Decode and check payload
    decoded_payload = decode_token(token)
    assert decoded_payload["user_id"] == 123
    assert decoded_payload["jti"] == "some_unique_id"
    assert decoded_payload["sub"] == "refresh"
    assert "exp" in decoded_payload

def test_decode_token_invalid():
    with pytest.raises(UnauthorizedException):
        decode_token("invalid.jwt.token")

    # Test with wrong secret
    settings.SECRET_KEY = "wrongsecret"
    token = create_access_token({"user_id": 1})
    settings.SECRET_KEY = "supersecretjwtkey_replace_me_in_production" # Reset for other tests
    with pytest.raises(UnauthorizedException):
        decode_token(token)

def test_decode_token_expired():
    expired_delta = timedelta(seconds=-1) # Token expires 1 second in the past
    token = create_access_token({"user_id": 1}, expires_delta=expired_delta)
    with pytest.raises(UnauthorizedException):
        decode_token(token)

def test_create_and_verify_password_reset_token():
    user_id = 1
    token = create_password_reset_token(user_id)
    assert isinstance(token, str)

    verified_user_id = verify_password_reset_token(token)
    assert verified_user_id == user_id

def test_verify_password_reset_token_invalid():
    assert verify_password_reset_token("invalid.reset.token") is None

    # Expired token
    old_expire_hours = settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS
    settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS = -1 # Make tokens expire instantly
    expired_token = create_password_reset_token(1)
    settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS = old_expire_hours # Reset
    assert verify_password_reset_token(expired_token) is None

def test_create_and_verify_email_verification_token():
    user_id = 1
    token = create_email_verification_token(user_id)
    assert isinstance(token, str)

    verified_user_id = verify_email_verification_token(token)
    assert verified_user_id == user_id

def test_verify_email_verification_token_invalid():
    assert verify_email_verification_token("invalid.verify.token") is None

    # Expired token
    old_expire_hours = settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
    settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = -1 # Make tokens expire instantly
    expired_token = create_email_verification_token(1)
    settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = old_expire_hours # Reset
    assert verify_email_verification_token(expired_token) is None

def test_token_expiration_times():
    # Test specific expiration times using custom deltas
    access_delta = timedelta(minutes=5)
    access_token = create_access_token({"user_id": 1}, expires_delta=access_delta)
    payload = decode_token(access_token)
    expected_exp = datetime.now(timezone.utc) + access_delta
    # Allow a small tolerance for comparison
    assert abs((payload["exp"] - expected_exp).total_seconds()) < 2

    refresh_delta = timedelta(days=1)
    refresh_token = create_refresh_token({"user_id": 1, "jti": "jti"}, expires_delta=refresh_delta)
    payload = decode_token(refresh_token)
    expected_exp = datetime.now(timezone.utc) + refresh_delta
    assert abs((payload["exp"] - expected_exp).total_seconds()) < 2

```
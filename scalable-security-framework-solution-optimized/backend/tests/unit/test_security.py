```python
import pytest
from datetime import timedelta
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings

def test_password_hashing():
    """Test password hashing and verification."""
    password = "testpassword123"
    hashed_password = get_password_hash(password)
    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("wrongpassword", hashed_password)

def test_create_and_decode_access_token():
    """Test access token creation and decoding."""
    user_id = 1
    data = {"sub": str(user_id), "type": "access", "role": "user"}
    token = create_access_token(data)
    
    decoded_payload = decode_token(token)
    assert decoded_payload is not None
    assert decoded_payload["sub"] == str(user_id)
    assert decoded_payload["type"] == "access"
    assert decoded_payload["aud"] == settings.JWT_AUDIENCE
    assert decoded_payload["iss"] == settings.JWT_ISSUER
    assert "exp" in decoded_payload
    assert "iat" in decoded_payload

def test_create_and_decode_refresh_token():
    """Test refresh token creation and decoding."""
    user_id = 1
    data = {"sub": str(user_id), "type": "refresh"}
    token = create_refresh_token(data)
    
    decoded_payload = decode_token(token)
    assert decoded_payload is not None
    assert decoded_payload["sub"] == str(user_id)
    assert decoded_payload["type"] == "refresh"
    assert decoded_payload["aud"] == settings.JWT_AUDIENCE
    assert decoded_payload["iss"] == settings.JWT_ISSUER
    assert "exp" in decoded_payload
    assert "iat" in decoded_payload

def test_expired_token():
    """Test that an expired token cannot be decoded."""
    user_id = 1
    data = {"sub": str(user_id), "type": "access"}
    # Create a token that expires immediately
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    
    import time
    time.sleep(1) # Ensure token is truly expired

    decoded_payload = decode_token(expired_token)
    assert decoded_payload is None

def test_invalid_token_signature():
    """Test decoding a token with an invalid signature."""
    user_id = 1
    data = {"sub": str(user_id), "type": "access"}
    token = create_access_token(data)
    
    # Modify the token to make its signature invalid
    parts = token.split('.')
    modified_token = f"{parts[0]}.{parts[1]}.invalid_signature"

    decoded_payload = decode_token(modified_token)
    assert decoded_payload is None

def test_token_with_wrong_audience():
    """Test decoding a token with an incorrect audience."""
    user_id = 1
    data = {"sub": str(user_id), "aud": "wrong-audience"} # Override audience
    token = create_access_token(data)
    # create_access_token function will enforce global audience
    # This test might need modification if `create_access_token` allows overriding `aud` directly.
    # For now, it implicitly uses `settings.JWT_AUDIENCE`.

    # Directly encode with a wrong audience to test decoding
    from jose import jwt
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
                      "aud": "wrong-audience"})
    wrong_aud_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    decoded_payload = decode_token(wrong_aud_token)
    assert decoded_payload is None

def test_token_with_wrong_issuer():
    """Test decoding a token with an incorrect issuer."""
    user_id = 1
    data = {"sub": str(user_id)}
    
    # Directly encode with a wrong issuer to test decoding
    from jose import jwt
    from datetime import datetime
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
                      "aud": settings.JWT_AUDIENCE, "iss": "wrong-issuer"})
    wrong_iss_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    decoded_payload = decode_token(wrong_iss_token)
    assert decoded_payload is None
```
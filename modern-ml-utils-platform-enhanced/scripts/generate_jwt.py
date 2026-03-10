```python
import jwt
from datetime import datetime, timedelta, timezone
import argparse
import os

def generate_jwt_token(user_id, role, secret, expiration_minutes=60, issuer="mlops-core-service"):
    """Generates a JWT token."""
    payload = {
        "user_id": user_id,
        "role": role,
        "iss": issuer,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    }
    encoded_jwt = jwt.encode(payload, secret, algorithm="HS256")
    return encoded_jwt

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate JWT tokens for MLOps Core Service.")
    parser.add_argument("--user_id", type=int, default=1, help="User ID for the token.")
    parser.add_argument("--role", type=str, default="admin", choices=["admin", "predictor", "viewer"], help="Role for the user (admin, predictor, viewer).")
    parser.add_argument("--secret", type=str, 
                        default=os.environ.get("MLOPS_JWT_SECRET", "your_super_secret_jwt_key_here_for_prod_use_a_strong_one_and_env_var"),
                        help="JWT secret key. Defaults to MLOPS_JWT_SECRET env var or a placeholder.")
    parser.add_argument("--expires_in", type=int, default=60, help="Token expiration time in minutes.")
    parser.add_argument("--output", type=str, default="token.txt", help="Output file to save the token.")

    args = parser.parse_args()

    if args.secret == "your_super_secret_jwt_key_here_for_prod_use_a_strong_one_and_env_var":
        print("WARNING: Using default placeholder JWT secret. Please configure MLOPS_JWT_SECRET environment variable or provide --secret argument for production use.")

    token = generate_jwt_token(args.user_id, args.role, args.secret, args.expires_in)
    
    with open(args.output, "w") as f:
        f.write(token)

    print(f"Generated {args.role} token for user_id {args.user_id}.")
    print(f"Token (saved to {args.output}): {token}")
    print(f"\nUse this token in your Authorization header: Bearer {token}")
```
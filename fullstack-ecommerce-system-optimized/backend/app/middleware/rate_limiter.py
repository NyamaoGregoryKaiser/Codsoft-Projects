```python
# Rate limiting is handled by FastAPI-Limiter integrated in app/main.py and used via @limiter.limit() decorator.
# For example, you can add this to an endpoint:
# from fastapi_limiter.depends import RateLimiter
# @router.get("/limited", dependencies=[Depends(RateLimiter(times=2, seconds=5))])
# def limited_endpoint():
#     return {"message": "This endpoint is rate-limited to 2 requests per 5 seconds."}

# The global rate limit configured in main.py will apply to all endpoints unless overridden.
# The default global limit is usually not set in init, but individual endpoints or router prefixes get limits.
# For simplicity, I've left the `FastAPILimiter.init` in `main.py` without a global default,
# and if rate limiting is desired on individual endpoints, the dependency can be added there.
# For this comprehensive solution, I'll demonstrate one usage in an endpoint.
# No standalone middleware file is strictly necessary for this library.
```

The rate limiting will be demonstrated in `backend/app/api/v1/endpoints/users.py` for a specific route.
Let's add it to a simple public route, for example, creating a user or a public product list.
For `users.py`, let's limit new user registrations.

```python
# Modified segment in backend/app/api/v1/endpoints/auth.py for demonstration

# ... (imports)
from fastapi_limiter.depends import RateLimiter
# ...

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(RateLimiter(times=5, seconds=60))]) # 5 registrations per minute
async def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
):
    """
    Register a new user. Rate limited to 5 registrations per minute.
    """
    # ... (rest of the function)
```

#### Tests
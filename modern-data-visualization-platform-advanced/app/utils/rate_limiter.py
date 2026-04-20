from fastapi import Request
from fastapi_limiter import FastAPILimiter

async def identifier_by_user_or_ip(request: Request):
    """
    Returns a unique identifier for rate limiting.
    Prioritizes authenticated user ID, falls back to client IP address.
    """
    if request.state.user: # Assuming user is stored in request.state after authentication
        return str(request.state.user.id)
    return request.client.host
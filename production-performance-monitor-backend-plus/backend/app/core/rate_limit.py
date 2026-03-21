from typing import Callable
from fastapi_limiter.depends import RateLimiter


# Define common rate limit strategies
# You can use these directly in your path operations:
# @router.post("/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
# Or define named ones for clarity:

# Allow 5 requests per minute
five_per_minute = RateLimiter(times=5, seconds=60)

# Allow 100 requests per hour (for general API access)
hundred_per_hour = RateLimiter(times=100, hours=1)

# Allow 1 request per second (for critical operations)
one_per_second = RateLimiter(times=1, seconds=1)

# Rate limiter for metric data submission (higher rate generally)
metric_data_rate_limit = RateLimiter(times=60, seconds=60) # 60 requests/minute per IP/key
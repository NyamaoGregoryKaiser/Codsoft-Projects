from fastapi import APIRouter
from app.api.v1 import auth, users, scrapers, jobs, results

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(scrapers.router, prefix="/scrapers", tags=["scrapers"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
```
---
from fastapi import APIRouter

from app.api.v1 import auth, users, databases, metrics, suggestions, tasks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(databases.router, prefix="/databases", tags=["Databases"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
api_router.include_router(suggestions.router, prefix="/suggestions", tags=["Optimization Suggestions"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Optimization Tasks"])
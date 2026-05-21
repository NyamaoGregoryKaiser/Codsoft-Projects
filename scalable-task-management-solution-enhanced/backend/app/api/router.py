from fastapi import APIRouter

from app.api.endpoints import auth, users, projects, tasks

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
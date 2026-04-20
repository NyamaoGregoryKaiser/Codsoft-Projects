from fastapi import APIRouter

from app.api.v1 import users, datasets, dashboards, charts

api_router = APIRouter(prefix="/v1")
api_router.include_router(users.router)
api_router.include_router(datasets.router)
api_router.include_router(dashboards.router)
api_router.include_router(charts.router)
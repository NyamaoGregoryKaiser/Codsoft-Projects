from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.database.session import get_db_session
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.database.models import User
from app.api.deps import get_current_active_user
from app.services.application_service import application_service
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.rate_limit import hundred_per_hour
from app.core.logging_config import logger


router = APIRouter()


@router.get("/", response_model=List[ApplicationResponse], dependencies=[Depends(hundred_per_hour)])
async def read_user_applications(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all applications owned by the current user.
    """
    logger.debug(f"User {current_user.email} retrieving applications (owner_id={current_user.id}).")
    applications = await application_service.get_applications_by_owner(db, current_user.id, skip=skip, limit=limit)
    return applications


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(hundred_per_hour)])
async def create_application(
    app_in: ApplicationCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new application for the current user.
    """
    logger.info(f"User {current_user.email} creating new application: {app_in.name}")
    application = await application_service.create_application(db, app_in, current_user)
    logger.info(f"Application {application.name} (ID: {application.id}) created by user {current_user.email}.")
    return application


@router.get("/{app_id}", response_model=ApplicationResponse, dependencies=[Depends(hundred_per_hour)])
async def read_application(
    app_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve a specific application by ID, ensuring ownership.
    """
    logger.debug(f"User {current_user.email} requesting application ID: {app_id}")
    application = await application_service.get_application(db, app_id)
    if not application:
        raise NotFoundException("Application not found")
    if application.owner_id != current_user.id and not current_user.is_admin:
        raise ForbiddenException("You are not authorized to access this application")
    return application


@router.put("/{app_id}", response_model=ApplicationResponse, dependencies=[Depends(hundred_per_hour)])
async def update_application(
    app_id: int,
    app_in: ApplicationUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a specific application by ID, ensuring ownership.
    """
    logger.info(f"User {current_user.email} updating application ID: {app_id}")
    updated_app = await application_service.update_application(db, app_id, app_in, current_user)
    logger.info(f"Application ID: {app_id} updated by user {current_user.email}.")
    return updated_app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(hundred_per_hour)])
async def delete_application(
    app_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a specific application by ID, ensuring ownership.
    """
    logger.warning(f"User {current_user.email} attempting to delete application ID: {app_id}")
    await application_service.delete_application(db, app_id, current_user)
    logger.info(f"Application ID: {app_id} deleted by user {current_user.email}.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
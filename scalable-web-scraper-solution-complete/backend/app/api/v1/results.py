from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.result import result as crud_result
from app.crud.task import task as crud_task
from app.schemas.result import ScrapingResult
from app.core.security import get_current_user_payload
from app.schemas.token import TokenData
from app.models.user import UserRole
from app.api.v1.tasks import check_task_ownership # Re-use task ownership check
from fastapi_cache.decorator import cache
from loguru import logger

router = APIRouter(prefix="/results", tags=["Scraping Results"])

@router.get("/task/{task_id}", response_model=List[ScrapingResult],
            description="Retrieve all scraping results for a specific task.")
@cache(expire=30) # Cache results for 30 seconds
async def get_results_for_task(
    task_id: int,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve all results associated with a specific task.
    Requires ownership of the task or admin privileges.
    """
    db_task = await crud_task.get(db, id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)
    
    results = await crud_result.get_results_by_task(db, task_id=task_id, skip=skip, limit=limit)
    logger.info(f"User {current_user_payload.id} retrieved {len(results)} results for task {task_id}.")
    return results

@router.get("/{result_id}", response_model=ScrapingResult,
            description="Retrieve a single scraping result by ID.")
async def get_scraping_result(
    result_id: int,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a single scraping result by its ID.
    Requires ownership of the associated task or admin privileges.
    """
    db_result = await crud_result.get(db, id=result_id)
    if not db_result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraping result not found")
    
    # Check ownership of the parent task
    db_task = await crud_task.get(db, id=db_result.task_id)
    if not db_task: # Should not happen if data integrity is maintained
        logger.error(f"Orphan result {result_id}: task {db_result.task_id} not found.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Associated task not found.")

    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)
    
    logger.info(f"User {current_user_payload.id} retrieved result {result_id} for task {db_task.id}.")
    return db_result

@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT,
               description="Delete a scraping result by ID.")
async def delete_scraping_result(
    result_id: int,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a specific scraping result.
    Requires ownership of the associated task or admin privileges.
    """
    db_result = await crud_result.get(db, id=result_id)
    if not db_result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraping result not found")
    
    # Check ownership of the parent task
    db_task = await crud_task.get(db, id=db_result.task_id)
    if not db_task:
        logger.error(f"Orphan result {result_id}: task {db_result.task_id} not found during delete.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Associated task not found.")

    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)
    
    await crud_result.delete(db, id=result_id)
    logger.info(f"User {current_user_payload.id} deleted result {result_id}.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

```
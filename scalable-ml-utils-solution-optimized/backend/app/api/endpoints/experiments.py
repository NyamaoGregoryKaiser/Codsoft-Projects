```python
from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.auth.auth_bearer import get_current_active_user
from backend.app.crud.crud_experiment import experiment as crud_experiment
from backend.app.crud.crud_model import model as crud_model
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.experiment import Experiment
from backend.app.core.exceptions import NotFoundException, BadRequestException
from backend.app.core.logging_config import logger
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.get("/", response_model=List[Experiment])
async def read_experiments(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve experiments associated with models owned by the current user.
    """
    # Fetch models owned by the user
    user_models = await crud_model.get_multi_by_owner(db, owner_id=current_user.id)
    model_ids = [m.id for m in user_models]

    if not model_ids:
        return []

    # Fetch experiments for those models
    experiments = []
    for model_id in model_ids:
        model_experiments = await crud_experiment.get_multi_by_model(db, model_id=model_id, skip=skip, limit=limit)
        experiments.extend(model_experiments)
    
    # Simple deduplication if any experiment is associated with multiple models (unlikely with current schema)
    # and re-sort to ensure consistent paging
    unique_experiments = {exp.id: exp for exp in experiments}
    sorted_experiments = sorted(unique_experiments.values(), key=lambda x: x.id)

    return sorted_experiments[skip:skip+limit]

@router.get("/{experiment_id}", response_model=Experiment)
async def read_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific experiment by ID.
    """
    # Load experiment with its associated model to check ownership
    experiment = await crud_experiment.get(db, id=experiment_id, options=[selectinload(Experiment.model)])
    if not experiment:
        raise NotFoundException(detail="Experiment not found.")
    
    # Check if the model associated with the experiment is owned by the current user
    if not experiment.model or experiment.model.owner_id != current_user.id:
        raise NotFoundException(detail="Experiment not found or not associated with a model owned by user.")
    
    return experiment

@router.delete("/{experiment_id}", response_model=Experiment)
async def delete_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete an experiment.
    """
    experiment = await crud_experiment.get(db, id=experiment_id, options=[selectinload(Experiment.model)])
    if not experiment or not experiment.model or experiment.model.owner_id != current_user.id:
        raise NotFoundException(detail="Experiment not found or not associated with a model owned by user.")

    deleted_experiment = await crud_experiment.remove(db, id=experiment_id)
    if not deleted_experiment:
        raise BadRequestException(detail="Failed to delete experiment.")

    logger.info(f"User {current_user.email} deleted experiment {deleted_experiment.name} (ID: {deleted_experiment.id}).")
    return deleted_experiment
```
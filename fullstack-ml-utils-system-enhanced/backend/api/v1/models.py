```python
from typing import Annotated, List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.ml_model import MLModelCreate, MLModelUpdate, MLModel
from backend.models import User as DBUser
from backend.dependencies import get_current_active_user
from backend.services.dataset_service import DatasetService
from backend.services.ml_service import MLService
from backend.core.exception_handlers import ResourceNotFoundError, UnauthorizedAccessError
from loguru import logger

router = APIRouter()
dataset_service = DatasetService() # Reuse global instance
ml_service = MLService(dataset_service) # MLService depends on DatasetService

@router.post("/", response_model=MLModel, status_code=status.HTTP_201_CREATED)
def create_ml_model(
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    model_create: MLModelCreate
):
    """
    Train and create a new Machine Learning model.
    """
    try:
        db_ml_model = ml_service.train_model(db, current_user, model_create)
        return db_ml_model
    except (ResourceNotFoundError, UnauthorizedAccessError) as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except HTTPException as e: # Catch specific HTTPExceptions from service layer
        raise e
    except Exception as e:
        logger.error(f"Failed to train model for user {current_user.id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to train model: {e}")

@router.get("/", response_model=List[MLModel])
def read_ml_models(
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Retrieve all ML models owned by the current user.
    """
    models = ml_service.get_all_models(db, current_user)
    return models

@router.get("/{model_id}", response_model=MLModel)
def read_ml_model(
    model_id: int,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Retrieve a specific ML model by its ID.
    """
    try:
        db_ml_model = ml_service.get_model(db, model_id)
        if db_ml_model.owner_id != current_user.id and not current_user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to view this model.")
        return db_ml_model
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.patch("/{model_id}", response_model=MLModel)
def update_ml_model(
    model_id: int,
    model_update: MLModelUpdate,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Update an existing ML model's metadata (name, description).
    """
    try:
        db_ml_model = ml_service.update_model(db, current_user, model_id, model_update)
        return db_ml_model
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ml_model(
    model_id: int,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Delete an ML model by its ID.
    """
    try:
        ml_service.delete_model(db, current_user, model_id)
        return {"message": "ML Model deleted successfully."}
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
```
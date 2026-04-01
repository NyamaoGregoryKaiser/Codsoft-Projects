```python
import asyncio
from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.auth.auth_bearer import get_current_active_user
from backend.app.crud.crud_model import model as crud_model
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.model import Model, ModelCreate, ModelUpdate, ModelPredictRequest
from backend.app.services.dataset_service import dataset_service
from backend.app.services.ml_service import ml_service
from backend.app.services.prediction_service import prediction_service
from backend.app.core.exceptions import NotFoundException, BadRequestException, InternalServerError
from backend.app.core.logging_config import logger

router = APIRouter()

@router.post("/train", response_model=Model, status_code=status.HTTP_201_CREATED)
async def train_new_model(
    model_in: ModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Train a new ML model.
    """
    dataset_df = await dataset_service.get_dataset_df(db, model_in.dataset_id, current_user.id)
    if dataset_df.empty:
        raise BadRequestException(detail="Dataset is empty or could not be loaded.")

    # In a real-world scenario, model training would be an asynchronous background task
    # (e.g., using Celery, RQ) to avoid blocking the API.
    # For this project, we'll run it directly but log the intent.
    logger.info(f"User {current_user.email} initiating model training for dataset {model_in.dataset_id}...")

    try:
        training_result = await ml_service.train_model(db, dataset_df, model_in, current_user.id)
        db_model = training_result["model"]
        db_experiment = training_result["experiment"]
        metrics = training_result["metrics"]
        logger.info(f"Model {db_model.name} (ID: {db_model.id}) trained successfully. Experiment ID: {db_experiment.id}. Metrics: {metrics}")
        return db_model
    except Exception as e:
        logger.exception(f"Error during model training for user {current_user.email}: {e}")
        raise InternalServerError(detail=f"Model training failed: {e}")

@router.get("/", response_model=List[Model])
async def read_models(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve current user's models.
    """
    models = await crud_model.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return models

@router.get("/{model_id}", response_model=Model)
async def read_model(
    model_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific model by ID.
    """
    model = await crud_model.get(db, id=model_id)
    if not model or model.owner_id != current_user.id:
        raise NotFoundException(detail="Model not found or not owned by user.")
    return model

@router.put("/{model_id}", response_model=Model)
async def update_model(
    model_id: int,
    model_in: ModelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a model's metadata.
    """
    model = await crud_model.get(db, id=model_id)
    if not model or model.owner_id != current_user.id:
        raise NotFoundException(detail="Model not found or not owned by user.")

    updated_model = await crud_model.update(db, db_obj=model, obj_in=model_in)
    logger.info(f"User {current_user.email} updated model {updated_model.name} (ID: {updated_model.id}).")
    return updated_model

@router.delete("/{model_id}", response_model=Model)
async def delete_model(
    model_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a model. This will also delete associated experiments and artifacts.
    """
    model = await crud_model.get(db, id=model_id)
    if not model or model.owner_id != current_user.id:
        raise NotFoundException(detail="Model not found or not owned by user.")

    # Delete model artifact from storage
    if model.artifact_path:
        try:
            await ml_service.storage.delete_file(model.artifact_path)
            # Remove from in-memory cache and Redis cache if present
            if model_id in prediction_service.loaded_models:
                del prediction_service.loaded_models[model_id]
            await prediction_service.cache.delete(f"model:{model_id}:artifact")
        except Exception as e:
            logger.warning(f"Failed to delete model artifact {model.artifact_path} from storage: {e}")
            # Do not re-raise, proceed with DB deletion

    deleted_model = await crud_model.remove(db, id=model_id)
    if not deleted_model:
        raise InternalServerError(detail="Failed to delete model from database.")

    logger.info(f"User {current_user.email} deleted model {deleted_model.name} (ID: {deleted_model.id}).")
    return deleted_model

@router.post("/predict", response_model=List[Any])
async def predict_with_model(
    request: ModelPredictRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Make predictions using a trained model.
    """
    if not request.data:
        raise BadRequestException(detail="Prediction data cannot be empty.")

    predictions = await prediction_service.predict(db, request, current_user.id)
    logger.info(f"User {current_user.email} made predictions with model {request.model_id}.")
    return predictions
```
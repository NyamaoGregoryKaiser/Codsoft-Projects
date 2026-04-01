```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List
import uuid
import joblib # For model serialization
import os
import io

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
from sklearn.impute import SimpleImputer # For handling missing values

from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.crud.crud_model import model as crud_model
from backend.app.crud.crud_experiment import experiment as crud_experiment
from backend.app.schemas.model import ModelCreate
from backend.app.schemas.experiment import ExperimentCreate
from backend.app.models.model import Model
from backend.app.models.experiment import Experiment
from backend.app.core.exceptions import BadRequestException, NotFoundException, InternalServerError
from backend.app.utils.storage import storage_manager
from backend.app.core.logging_config import logger

class MLService:
    def __init__(self, storage=storage_manager):
        self.storage = storage

    async def preprocess_dataframe(self, df: pd.DataFrame, features: List[str], target_column: str) -> pd.DataFrame:
        """
        Performs basic preprocessing:
        1. Selects specified features and target.
        2. Handles missing values using median/mode imputation.
        3. Encodes categorical features.
        """
        # Ensure selected columns exist
        all_cols = features + [target_column]
        missing_cols = [col for col in all_cols if col not in df.columns]
        if missing_cols:
            raise BadRequestException(detail=f"Missing columns in dataset: {', '.join(missing_cols)}")

        df_processed = df[all_cols].copy()

        # Impute missing values
        for col in df_processed.columns:
            if df_processed[col].isnull().any():
                if pd.api.types.is_numeric_dtype(df_processed[col]):
                    imputer = SimpleImputer(strategy='median')
                    df_processed[col] = imputer.fit_transform(df_processed[[col]])
                else:
                    imputer = SimpleImputer(strategy='most_frequent')
                    df_processed[col] = imputer.fit_transform(df_processed[[col]])

        # Label encode categorical features (simple approach, for one-hot use more sophisticated pipeline)
        for col in features:
            if df_processed[col].dtype == 'object' or df_processed[col].dtype == 'category':
                le = LabelEncoder()
                df_processed[col] = le.fit_transform(df_processed[col])
                logger.info(f"Label encoded column: {col}")

        # Label encode target column if categorical
        if df_processed[target_column].dtype == 'object' or df_processed[target_column].dtype == 'category':
            le = LabelEncoder()
            df_processed[target_column] = le.fit_transform(df_processed[target_column])
            logger.info(f"Label encoded target column: {target_column}")

        return df_processed

    async def train_model(
        self,
        db: AsyncSession,
        dataset_df: pd.DataFrame,
        model_create: ModelCreate,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Trains an ML model based on the provided dataframe and model parameters.
        Returns model, metrics, and artifact path.
        """
        df_processed = await self.preprocess_dataframe(dataset_df, model_create.features, model_create.target_column)

        X = df_processed[model_create.features]
        y = df_processed[model_create.target_column]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = None
        metrics: Dict[str, Any] = {}

        if model_create.model_type == "classification":
            # Heuristic for default classifier
            if len(y.unique()) > 2: # Multi-class
                model = RandomForestClassifier(random_state=42)
            else: # Binary classification
                model = LogisticRegression(random_state=42, solver='liblinear')

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            metrics["accuracy"] = accuracy_score(y_test, y_pred)
            metrics["precision"] = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            metrics["recall"] = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            metrics["f1_score"] = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            try:
                if len(y.unique()) > 2:
                    metrics["roc_auc"] = roc_auc_score(y_test, model.predict_proba(X_test), multi_class='ovr')
                else:
                    metrics["roc_auc"] = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
            except AttributeError: # If model doesn't have predict_proba
                metrics["roc_auc"] = None

        elif model_create.model_type == "regression":
            # Heuristic for default regressor
            model = LinearRegression() # Simple default
            # Or RandomForestRegressor(random_state=42) for more complex
            # model = RandomForestRegressor(random_state=42)

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            metrics["mse"] = mean_squared_error(y_test, y_pred)
            metrics["rmse"] = np.sqrt(metrics["mse"])
            metrics["r2_score"] = r2_score(y_test, y_pred)

        else:
            raise BadRequestException(detail=f"Unsupported model type: {model_create.model_type}")

        if model is None:
            raise InternalServerError(detail="Model training failed, no model object created.")

        # Serialize model
        run_id = str(uuid.uuid4())
        model_artifact_path = f"models/{user_id}/{model_create.dataset_id}/{run_id}.joblib"
        model_bytes = io.BytesIO()
        joblib.dump(model, model_bytes)
        model_bytes.seek(0) # Rewind to beginning
        await self.storage.save_file(model_bytes.getvalue(), model_artifact_path)
        logger.info(f"Model saved to: {model_artifact_path}")

        # Store model metadata in DB
        db_model = await crud_model.create_with_owner(
            db,
            obj_in=model_create,
            owner_id=user_id,
            artifact_path=model_artifact_path
        )

        # Store experiment metadata in DB
        experiment_in = ExperimentCreate(
            name=f"{model_create.name} - Run {run_id[:8]}",
            description=f"Training run for {model_create.model_type} model on dataset {model_create.dataset_id}",
            model_id=db_model.id,
            run_id=run_id,
            hyperparameters=model.get_params(), # Store actual params used by scikit-learn
            metrics=metrics,
            status="completed"
        )
        db_experiment = await crud_experiment.create(db, obj_in=experiment_in)

        return {
            "model": db_model,
            "experiment": db_experiment,
            "metrics": metrics
        }

ml_service = MLService()
```
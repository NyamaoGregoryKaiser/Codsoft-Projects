```python
import pandas as pd
import numpy as np
import joblib
import os
from typing import Dict, Any, List, Tuple
from datetime import datetime, UTC
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from loguru import logger
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder, LabelEncoder, SimpleImputer
from sklearn.impute import KNNImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# Classification Models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

# Regression Models
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor

from backend.models import MLModel as DBMLModel, Dataset as DBDataset, User as DBUser
from backend.schemas.ml_model import MLModelCreate, MLModelUpdate, PredictionRequest, PredictionResponse
from backend.schemas.preprocessing import PreprocessingStepConfig
from backend.core.config import settings
from backend.core.exception_handlers import ResourceNotFoundError, UnauthorizedAccessError
from backend.services.dataset_service import DatasetService
from backend.services.cache_service import cache_service

class MLService:
    def __init__(self, dataset_service: DatasetService):
        self.dataset_service = dataset_service
        self.supported_classification_algorithms = {
            "logistic_regression": LogisticRegression,
            "random_forest": RandomForestClassifier,
            "svm_classifier": SVC,
            "decision_tree_classifier": DecisionTreeClassifier
        }
        self.supported_regression_algorithms = {
            "linear_regression": LinearRegression,
            "ridge_regression": Ridge,
            "lasso_regression": Lasso,
            "random_forest_regressor": RandomForestRegressor,
            "decision_tree_regressor": DecisionTreeRegressor
        }

    def _get_model_class(self, model_type: str, algorithm: str):
        if model_type == 'classification':
            return self.supported_classification_algorithms.get(algorithm)
        elif model_type == 'regression':
            return self.supported_regression_algorithms.get(algorithm)
        return None

    def _create_preprocessor_pipeline(self, df: pd.DataFrame, config: PreprocessingStepConfig, features: List[str]):
        numerical_cols = df[features].select_dtypes(include=np.number).columns.tolist()
        categorical_cols = df[features].select_dtypes(exclude=np.number).columns.tolist()

        transformers = []

        if config.imputation:
            imputation_strategy = config.imputation.strategy
            imputer = None
            if imputation_strategy == 'mean':
                imputer = SimpleImputer(strategy='mean')
            elif imputation_strategy == 'median':
                imputer = SimpleImputer(strategy='median')
            elif imputation_strategy == 'mode':
                imputer = SimpleImputer(strategy='most_frequent')
            elif imputation_strategy == 'constant':
                imputer = SimpleImputer(strategy='constant', fill_value=config.imputation.fill_value)
            
            if imputer:
                impute_target_cols = config.imputation.target_columns if config.imputation.target_columns else numerical_cols + categorical_cols
                impute_num_cols = [col for col in impute_target_cols if col in numerical_cols]
                impute_cat_cols = [col for col in impute_target_cols if col in categorical_cols]
                
                if impute_num_cols:
                    transformers.append(('num_imputer', SimpleImputer(strategy=imputation_strategy), impute_num_cols))
                if impute_cat_cols and imputation_strategy in ['mode', 'constant']:
                     transformers.append(('cat_imputer', SimpleImputer(strategy=imputation_strategy, fill_value=config.imputation.fill_value), impute_cat_cols))

        if config.scaling:
            scaling_strategy = config.scaling.strategy
            scaler = None
            if scaling_strategy == 'standard':
                scaler = StandardScaler()
            elif scaling_strategy == 'minmax':
                scaler = MinMaxScaler()
            
            if scaler:
                scale_target_cols = config.scaling.target_columns if config.scaling.target_columns else numerical_cols
                scale_num_cols = [col for col in scale_target_cols if col in numerical_cols]
                if scale_num_cols:
                    transformers.append(('scaler', scaler, scale_num_cols))

        if config.encoding:
            encoding_strategy = config.encoding.strategy
            encoder = None
            if encoding_strategy == 'onehot':
                encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
            elif encoding_strategy == 'label':
                # LabelEncoder is typically for target variable or for ordinal features,
                # not directly for feature columns in a ColumnTransformer without careful handling.
                # For simplicity, we'll use OneHotEncoder for feature columns here,
                # or consider it only for single column transformation.
                # For ColumnTransformer, OneHot is safer for features.
                pass # This would need more complex handling for multi-column label encoding
            
            if encoder:
                encode_target_cols = config.encoding.target_columns if config.encoding.target_columns else categorical_cols
                encode_cat_cols = [col for col in encode_target_cols if col in categorical_cols]
                if encode_cat_cols:
                    transformers.append(('encoder', encoder, encode_cat_cols))

        if not transformers:
            return None # No preprocessing specified

        # Default passthrough for other columns if not transformed
        preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='passthrough'
        )
        return preprocessor


    def train_model(self, db: Session, user: DBUser, model_create: MLModelCreate) -> DBMLModel:
        dataset = self.dataset_service.get_dataset(db, model_create.dataset_id)
        if dataset.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to use this dataset.")

        df = self.dataset_service.get_dataset_dataframe(dataset)

        # Handle features: if not provided, use all columns except target
        if model_create.features:
            features = [f for f in model_create.features if f != model_create.target_column]
        else:
            features = [col for col in df.columns if col != model_create.target_column]

        if model_create.target_column not in df.columns:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Target column '{model_create.target_column}' not found in dataset.")
        
        # Check if all selected features exist in the DataFrame
        missing_features = [f for f in features if f not in df.columns]
        if missing_features:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Features not found in dataset: {', '.join(missing_features)}")

        X = df[features]
        y = df[model_create.target_column]

        # Basic data type conversion for target column if it's classification and looks numerical but isn't
        if model_create.model_type == 'classification':
            y = y.astype('category').cat.codes # Convert categorical target to numerical for scikit-learn

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y if model_create.model_type == 'classification' else None)

        ModelClass = self._get_model_class(model_create.model_type, model_create.algorithm)
        if not ModelClass:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported algorithm '{model_create.algorithm}' for model type '{model_create.model_type}'.")

        # Create a preprocessing pipeline for features within the training
        # This simplifies handling transformations consistently for training and prediction
        preprocessor_pipeline = None
        preprocessor_path = None
        
        # We need to build a PreprocessingStepConfig for the model's internal preprocessor
        # For simplicity in this example, we will apply a default StandardScaler/OneHotEncoder
        # In a real app, preprocessing steps would be explicitly selected by the user
        numerical_cols = X_train.select_dtypes(include=np.number).columns
        categorical_cols = X_train.select_dtypes(exclude=np.number).columns

        transformers = []
        if len(numerical_cols) > 0:
            transformers.append(('num', StandardScaler(), numerical_cols))
        if len(categorical_cols) > 0:
            transformers.append(('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols))

        if transformers:
            preprocessor_pipeline = ColumnTransformer(
                transformers=transformers,
                remainder='passthrough'
            )
            logger.info(f"Created internal preprocessor for model training with transformers: {[t[0] for t in transformers]}")


        # Initialize model with hyperparameters
        hyperparameters = model_create.hyperparameters or {}
        try:
            model = ModelClass(**hyperparameters)
        except TypeError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid hyperparameters for {model_create.algorithm}: {e}")

        # Integrate preprocessor and model into a single pipeline for robustness
        full_pipeline_steps = []
        if preprocessor_pipeline:
            full_pipeline_steps.append(('preprocessor', preprocessor_pipeline))
        full_pipeline_steps.append(('model', model))

        full_pipeline = Pipeline(full_pipeline_steps)

        # Train the model
        try:
            full_pipeline.fit(X_train, y_train)
            logger.info(f"Model {model_create.algorithm} trained on dataset {dataset.id}.")
        except Exception as e:
            logger.error(f"Error training model {model_create.algorithm}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Model training failed: {e}")

        # Evaluate the model
        y_pred = full_pipeline.predict(X_test)
        metrics = self._evaluate_model(y_test, y_pred, model_create.model_type)
        logger.info(f"Model {model_create.algorithm} evaluated with metrics: {metrics}")

        # Save the model and preprocessor
        model_filename = f"{model_create.name.lower().replace(' ', '_')}_{user.id}_{dataset.id}_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}.joblib"
        model_path = os.path.join(settings.MODEL_DIRECTORY, model_filename)
        joblib.dump(full_pipeline, model_path) # Save the entire pipeline

        db_ml_model = DBMLModel(
            owner_id=user.id,
            dataset_id=dataset.id,
            name=model_create.name,
            description=model_create.description,
            target_column=model_create.target_column,
            features=features,
            model_type=model_create.model_type,
            algorithm=model_create.algorithm,
            model_path=model_path,
            preprocessor_path=preprocessor_path, # In this setup, preprocessor is part of the model_path
            hyperparameters=hyperparameters,
            metrics=metrics,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        db.add(db_ml_model)
        db.commit()
        db.refresh(db_ml_model)
        logger.info(f"ML Model {db_ml_model.id} created by user {user.id}")
        return db_ml_model

    def _evaluate_model(self, y_true: pd.Series, y_pred: np.ndarray, model_type: str) -> Dict[str, Any]:
        metrics = {}
        if model_type == 'classification':
            metrics['accuracy'] = accuracy_score(y_true, y_pred)
            metrics['precision'] = precision_score(y_true, y_pred, average='weighted', zero_division=0)
            metrics['recall'] = recall_score(y_true, y_pred, average='weighted', zero_division=0)
            metrics['f1_score'] = f1_score(y_true, y_pred, average='weighted', zero_division=0)
            # if len(np.unique(y_true)) == 2: # Only for binary classification
            #     metrics['roc_auc'] = roc_auc_score(y_true, y_pred)
        elif model_type == 'regression':
            metrics['mse'] = mean_squared_error(y_true, y_pred)
            metrics['rmse'] = np.sqrt(mean_squared_error(y_true, y_pred))
            metrics['mae'] = mean_absolute_error(y_true, y_pred)
            metrics['r2_score'] = r2_score(y_true, y_pred)
        return metrics

    def get_model(self, db: Session, model_id: int) -> DBMLModel:
        db_model = db.query(DBMLModel).filter(DBMLModel.id == model_id).first()
        if not db_model:
            raise ResourceNotFoundError(f"ML Model with ID {model_id} not found.")
        return db_model

    def get_all_models(self, db: Session, user: DBUser) -> List[DBMLModel]:
        return db.query(DBMLModel).filter(DBMLModel.owner_id == user.id).all()

    def update_model(self, db: Session, user: DBUser, model_id: int, model_update: MLModelUpdate) -> DBMLModel:
        db_model = self.get_model(db, model_id)
        if db_model.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to update this model.")

        update_data = model_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_model, key, value)
        db_model.updated_at = datetime.now(UTC)
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        logger.info(f"ML Model {db_model.id} updated by user {user.id}")
        return db_model

    def delete_model(self, db: Session, user: DBUser, model_id: int):
        db_model = self.get_model(db, model_id)
        if db_model.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to delete this model.")

        # Delete associated model file
        if os.path.exists(db_model.model_path):
            os.remove(db_model.model_path)
            logger.info(f"Model file {db_model.model_path} deleted.")
        # if db_model.preprocessor_path and os.path.exists(db_model.preprocessor_path):
        #     os.remove(db_model.preprocessor_path)
        #     logger.info(f"Preprocessor file {db_model.preprocessor_path} deleted.")

        # Invalidate cache
        cache_service.delete(f"ml_model_{model_id}")

        db.delete(db_model)
        db.commit()
        logger.info(f"ML Model {db_model.id} deleted by user {user.id}")

    def load_model_pipeline(self, model_id: int) -> Any:
        cache_key = f"ml_model_{model_id}"
        model_pipeline = cache_service.get(cache_key)
        if model_pipeline is not None:
            logger.debug(f"Loaded ML model {model_id} from cache.")
            return model_pipeline

        db_model = self.get_model(db=Session(self.dataset_service.db_engine), model_id=model_id) # Need a temp session
        if not os.path.exists(db_model.model_path):
            raise ResourceNotFoundError(f"Model file for ID {model_id} not found at {db_model.model_path}.")
        
        model_pipeline = joblib.load(db_model.model_path)
        cache_service.set(cache_key, model_pipeline, ex=3600*24) # Cache models for longer (1 day)
        logger.debug(f"Loaded ML model {model_id} from file and cached.")
        return model_pipeline

    def make_predictions(self, db: Session, user: DBUser, prediction_request: PredictionRequest) -> PredictionResponse:
        db_model = self.get_model(db, prediction_request.model_id)
        if db_model.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to use this model for predictions.")

        model_pipeline = self.load_model_pipeline(prediction_request.model_id)

        try:
            # Convert input data to DataFrame, ensuring columns match training features
            input_df = pd.DataFrame(prediction_request.data)
            
            # Ensure the input_df has the same columns as the features the model was trained on
            # and in the same order. Missing columns will be filled with NaN (if appropriate)
            # or raise error if feature types are strict.
            # Extra columns will be ignored by the preprocessor/model pipeline.
            
            # Reindex input_df to match features order used during training
            # This is critical for ColumnTransformer and model consistency
            required_features = db_model.features
            input_df_aligned = input_df.reindex(columns=required_features, fill_value=np.nan)

            predictions = model_pipeline.predict(input_df_aligned).tolist()
            
            # If classification, convert codes back to original labels if possible
            if db_model.model_type == 'classification':
                # This would require storing the label encoder mapping during training
                # For simplicity, we return numerical predictions or raw labels if available
                pass

            return PredictionResponse(
                predictions=predictions,
                model_id=prediction_request.model_id,
                message="Predictions generated successfully."
            )
        except Exception as e:
            logger.error(f"Error making predictions with model {db_model.id}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction failed: {e}")
            
    def apply_preprocessing(self, db: Session, user: DBUser, dataset_id: int, new_dataset_name: str, config: PreprocessingStepConfig, description: Optional[str]) -> DBDataset:
        original_dataset = self.dataset_service.get_dataset(db, dataset_id)
        if original_dataset.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to preprocess this dataset.")

        df = self.dataset_service.get_dataset_dataframe(original_dataset)

        # Create a preprocessor pipeline based on the config
        preprocessor = self._create_preprocessor_pipeline(df, config, df.columns.tolist())
        
        if preprocessor is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid preprocessing steps configured.")

        # Apply preprocessing
        try:
            processed_data = preprocessor.fit_transform(df)
            
            # Determine new column names after transformations
            new_column_names = []
            for name, transformer, columns in preprocessor.transformers_:
                if name == 'remainder' and transformer == 'passthrough':
                    new_column_names.extend(columns) # untouched original columns
                elif hasattr(transformer, 'get_feature_names_out'):
                    new_column_names.extend(transformer.get_feature_names_out(columns))
                else:
                    new_column_names.extend([f"{name}_{c}" for c in columns]) # fallback for simple transformers

            processed_df = pd.DataFrame(processed_data, columns=new_column_names)

            # Handle dropping columns at the end, after other steps.
            # This logic needs to be careful about transformed columns vs original names.
            if config.drop_columns:
                cols_to_drop_actual = [col for col in config.drop_columns.columns if col in processed_df.columns]
                processed_df = processed_df.drop(columns=cols_to_drop_actual)
                logger.info(f"Dropped columns {cols_to_drop_actual} from preprocessed dataset.")


            # Save the new dataset
            new_file_name = f"{new_dataset_name.lower().replace(' ', '_')}_{user.id}_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}.parquet"
            new_file_path = os.path.join(settings.UPLOAD_DIRECTORY, new_file_name)
            processed_df.to_parquet(new_file_path, index=False)
            logger.info(f"Preprocessed dataset saved to {new_file_path}")

            new_dataset = DBDataset(
                name=new_dataset_name,
                description=description or f"Preprocessed version of {original_dataset.name}",
                owner_id=user.id,
                file_path=new_file_path,
                file_size_bytes=os.path.getsize(new_file_path),
                row_count=len(processed_df),
                column_count=len(processed_df.columns),
                is_preprocessed=True,
                original_dataset_id=original_dataset.id,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(new_dataset)
            db.commit()
            db.refresh(new_dataset)
            logger.info(f"New preprocessed dataset {new_dataset.id} created from {original_dataset.id}.")
            
            # Invalidate cache for new dataset (it will be populated on first access)
            cache_service.delete(f"dataset_df_{new_dataset.id}")
            cache_service.delete(f"dataset_stats_{new_dataset.id}")

            return new_dataset

        except Exception as e:
            logger.error(f"Error applying preprocessing to dataset {dataset_id}: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Preprocessing failed: {e}")
```
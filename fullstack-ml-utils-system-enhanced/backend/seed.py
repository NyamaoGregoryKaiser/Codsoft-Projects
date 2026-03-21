```python
import sys
import os
from pathlib import Path
from typing import Generator
from datetime import datetime, UTC

# Add parent directory to path to allow absolute imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import SessionLocal, engine, Base
from backend.models import User, Dataset, MLModel
from backend.core.config import settings
from backend.core.security import get_password_hash
from loguru import logger
import pandas as pd
import joblib
import numpy as np

def init_db():
    logger.info("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("Creating all new tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created.")

def seed_data():
    db: Generator = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@mltoolbox.com").first():
            hashed_password = get_password_hash("adminpass")
            admin_user = User(
                email="admin@mltoolbox.com",
                hashed_password=hashed_password,
                is_active=True,
                is_superuser=True,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info(f"Admin user '{admin_user.email}' created.")

            # Create a dummy dataset
            dummy_df = pd.DataFrame({
                'feature_a': np.random.rand(100),
                'feature_b': np.random.randint(0, 10, 100),
                'target': np.random.choice([0, 1], 100)
            })
            dataset_name = "Dummy_Dataset"
            file_name = f"{dataset_name.lower().replace(' ', '_')}_{admin_user.id}.csv"
            file_path = os.path.join(settings.UPLOAD_DIRECTORY, file_name)
            dummy_df.to_csv(file_path, index=False)

            dummy_dataset = Dataset(
                owner_id=admin_user.id,
                name=dataset_name,
                file_path=file_path,
                file_size_bytes=os.path.getsize(file_path),
                row_count=len(dummy_df),
                column_count=len(dummy_df.columns),
                description="A dummy dataset for testing purposes.",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(dummy_dataset)
            db.commit()
            db.refresh(dummy_dataset)
            logger.info(f"Dummy dataset '{dummy_dataset.name}' created.")

            # Create a dummy ML model (not fully trained, just a placeholder)
            from sklearn.linear_model import LogisticRegression
            dummy_model = LogisticRegression() # Untrained for seeding purposes
            model_name = "Dummy_LogReg_Model"
            model_file_name = f"{model_name.lower().replace(' ', '_')}_{admin_user.id}_{dummy_dataset.id}.joblib"
            model_path = os.path.join(settings.MODEL_DIRECTORY, model_file_name)
            joblib.dump(dummy_model, model_path)

            dummy_ml_model = MLModel(
                owner_id=admin_user.id,
                dataset_id=dummy_dataset.id,
                name=model_name,
                description="An untrained dummy Logistic Regression model.",
                target_column="target",
                features=['feature_a', 'feature_b'],
                model_type="classification",
                algorithm="logistic_regression",
                model_path=model_path,
                hyperparameters={"C": 1.0},
                metrics={"accuracy": 0.0, "f1_score": 0.0}, # Placeholder metrics
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(dummy_ml_model)
            db.commit()
            db.refresh(dummy_ml_model)
            logger.info(f"Dummy ML model '{dummy_ml_model.name}' created.")

        else:
            logger.info("Admin user already exists. Skipping creation.")

    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    from backend.core.logging import setup_logging
    setup_logging()
    logger.info("Initializing database and seeding data...")
    init_db()
    seed_data()
    logger.info("Database initialization and seeding complete.")
```
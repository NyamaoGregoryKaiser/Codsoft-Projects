```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    datasets = relationship("Dataset", back_populates="owner")
    ml_models = relationship("MLModel", back_populates="owner")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    file_path = Column(String, nullable=False) # Path to the stored CSV/Parquet file
    file_size_bytes = Column(Integer)
    row_count = Column(Integer)
    column_count = Column(Integer)
    description = Column(Text)
    is_preprocessed = Column(Boolean, default=False)
    original_dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True) # For preprocessed datasets

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="datasets")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship for tracking preprocessed datasets
    original_dataset = relationship("Dataset", remote_side=[id], backref="preprocessed_versions", uselist=True)

    ml_models = relationship("MLModel", back_populates="dataset")

class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    target_column = Column(String, nullable=False)
    features = Column(JSON, nullable=False) # Store as JSON array of strings
    model_type = Column(String, nullable=False) # 'classification' or 'regression'
    algorithm = Column(String, nullable=False) # 'logistic_regression', 'random_forest', etc.
    model_path = Column(String, nullable=False) # Path to the serialized model file
    preprocessor_path = Column(String, nullable=True) # Path to the serialized preprocessor (if used)
    hyperparameters = Column(JSON, nullable=True) # JSON object for hyperparameters
    metrics = Column(JSON, nullable=True) # JSON object for evaluation metrics

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="ml_models")
    dataset = relationship("Dataset", back_populates="ml_models")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```
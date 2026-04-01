```python
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Dict, Any

from backend.app.db.base_class import Base # Corrected import
from backend.app.models.user import User # Ensure User is imported for relationship
from backend.app.models.dataset import Dataset # Ensure Dataset is imported for relationship

class Model(Base):
    __tablename__ = "models"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., 'classification', 'regression'
    artifact_path: Mapped[str | None] = mapped_column(String(500), nullable=True) # Path to serialized model file
    target_column: Mapped[str | None] = mapped_column(String(100), nullable=True) # The column the model predicts
    features: Mapped[List[str] | None] = mapped_column(JSON, nullable=True) # List of features used for training
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    dataset_id: Mapped[int | None] = mapped_column(ForeignKey("datasets.id"), index=True, nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="models")
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="models")
    experiments: Mapped[List["Experiment"]] = relationship("Experiment", back_populates="model", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Model(id={self.id}, name='{self.name}', type='{self.model_type}')>"
```
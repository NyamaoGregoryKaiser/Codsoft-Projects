```python
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Dict, Any

from backend.app.db.base_class import Base # Corrected import
from backend.app.models.model import Model # Ensure Model is imported for relationship

class Experiment(Base):
    __tablename__ = "experiments"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    run_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False) # Unique identifier for this specific ML run
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"), index=True, nullable=False)
    hyperparameters: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False) # e.g., 'pending', 'running', 'completed', 'failed'

    # Relationships
    model: Mapped["Model"] = relationship("Model", back_populates="experiments")

    def __repr__(self):
        return f"<Experiment(id={self.id}, name='{self.name}', run_id='{self.run_id}', model_id={self.model_id})>"
```
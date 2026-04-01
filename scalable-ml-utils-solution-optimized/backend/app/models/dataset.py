```python
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Dict, Any

from backend.app.db.base_class import Base # Corrected import
from backend.app.models.user import User # Ensure User is imported for relationship

class Dataset(Base):
    __tablename__ = "datasets"

    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False) # Path to stored CSV/parquet
    column_info: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True) # e.g., {"col1": "type", "col2": "type"}
    row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="datasets")
    models: Mapped[list["Model"]] = relationship("Model", back_populates="dataset")

    def __repr__(self):
        return f"<Dataset(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"
```
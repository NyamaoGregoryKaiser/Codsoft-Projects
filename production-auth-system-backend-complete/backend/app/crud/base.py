from typing import TypeVar, Generic, List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import declarative_base

# Define a generic type for SQLAlchemy models
ModelType = TypeVar("ModelType", bound=declarative_base())

class CRUDBase(Generic[ModelType]):
    """
    Base class for CRUD operations.
    Provides generic methods for creating, reading, updating, and deleting records.
    """
    def __init__(self, model: type[ModelType]):
        """
        Initialize with the SQLAlchemy model.
        """
        self.model = model

    async def create(self, db: AsyncSession, obj_in: Dict[str, Any]) -> ModelType:
        """
        Creates a new record in the database.
        :param db: The database session.
        :param obj_in: Dictionary of attributes for the new record.
        :return: The created model instance.
        """
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """
        Retrieves a single record by its ID.
        :param db: The database session.
        :param id: The ID of the record to retrieve.
        :return: The model instance if found, else None.
        """
        stmt = select(self.model).where(self.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Retrieves multiple records with pagination.
        :param db: The database session.
        :param skip: Number of records to skip.
        :param limit: Maximum number of records to return.
        :return: A list of model instances.
        """
        stmt = select(self.model).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def update(
        self, db: AsyncSession, db_obj: ModelType, obj_in: Dict[str, Any]
    ) -> ModelType:
        """
        Updates an existing record.
        :param db: The database session.
        :param db_obj: The existing model instance to update.
        :param obj_in: Dictionary of attributes to update.
        :return: The updated model instance.
        """
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """
        Deletes a record by its ID.
        :param db: The database session.
        :param id: The ID of the record to delete.
        :return: The deleted model instance if found, else None.
        """
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

```
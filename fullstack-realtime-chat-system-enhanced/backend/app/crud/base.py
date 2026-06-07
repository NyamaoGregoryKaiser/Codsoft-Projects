```python
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.models.base import Base # Assuming Base is defined in app.models.base

# Define type variables for SQLAlchemy model and Pydantic schemas
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic CRUD operations for SQLAlchemy models.
    Provides basic create, read, update, and delete functionalities.
    """
    def __init__(self, model: Type[ModelType]):
        """
        Initializes the CRUD class with the SQLAlchemy model.

        Args:
            model (Type[ModelType]): The SQLAlchemy model class.
        """
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """
        Retrieves a single record by its ID.

        Args:
            db (AsyncSession): The asynchronous database session.
            id (Any): The primary key of the record.

        Returns:
            Optional[ModelType]: The found model instance, or None if not found.
        """
        result = await db.execute(select(self.model).filter(self.model.id == id))
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Retrieves multiple records with pagination.

        Args:
            db (AsyncSession): The asynchronous database session.
            skip (int): Number of records to skip (offset).
            limit (int): Maximum number of records to return.

        Returns:
            List[ModelType]: A list of model instances.
        """
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Creates a new record in the database.

        Args:
            db (AsyncSession): The asynchronous database session.
            obj_in (CreateSchemaType): The Pydantic schema containing data for creation.

        Returns:
            ModelType: The newly created model instance.
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Updates an existing record in the database.

        Args:
            db (AsyncSession): The asynchronous database session.
            db_obj (ModelType): The existing SQLAlchemy model instance to update.
            obj_in (Union[UpdateSchemaType, Dict[str, Any]]): The Pydantic schema or
                                                              dictionary with update data.

        Returns:
            ModelType: The updated model instance.
        """
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True) # Use model_dump for Pydantic v2+

        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> Optional[ModelType]:
        """
        Deletes a record from the database by its ID.

        Args:
            db (AsyncSession): The asynchronous database session.
            id (int): The primary key of the record to delete.

        Returns:
            Optional[ModelType]: The deleted model instance, or None if not found.
        """
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

    async def get_by_field(
        self, db: AsyncSession, field: InstrumentedAttribute, value: Any
    ) -> Optional[ModelType]:
        """
        Retrieves a single record by a specific field's value.

        Args:
            db (AsyncSession): The asynchronous database session.
            field (InstrumentedAttribute): The SQLAlchemy column attribute (e.g., User.email).
            value (Any): The value to match for the given field.

        Returns:
            Optional[ModelType]: The found model instance, or None if not found.
        """
        result = await db.execute(select(self.model).filter(field == value))
        return result.scalars().first()

    async def get_multi_by_field(
        self, db: AsyncSession, field: InstrumentedAttribute, value: Any, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Retrieves multiple records by a specific field's value with pagination.

        Args:
            db (AsyncSession): The asynchronous database session.
            field (InstrumentedAttribute): The SQLAlchemy column attribute.
            value (Any): The value to match.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            List[ModelType]: A list of matching model instances.
        """
        result = await db.execute(
            select(self.model).filter(field == value).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

```
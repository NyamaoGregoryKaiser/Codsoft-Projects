from typing import Generic, TypeVar, Type, Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class CRUDBase(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete.
        :param model: A SQLAlchemy model class
        """
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Retrieve a single record by ID."""
        stmt = select(self.model).where(self.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[List[Any]] = None,
        load_related: Optional[List[str]] = None
    ) -> List[ModelType]:
        """Retrieve multiple records with optional filters, ordering, and related object loading."""
        stmt = select(self.model).offset(skip).limit(limit)

        if filters:
            for key, value in filters.items():
                stmt = stmt.where(getattr(self.model, key) == value)

        if order_by:
            stmt = stmt.order_by(*order_by)

        if load_related:
            for relation in load_related:
                stmt = stmt.options(selectinload(getattr(self.model, relation)))

        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(self, db: AsyncSession, obj_in: Dict[str, Any]) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, db_obj: ModelType, obj_in: Dict[str, Any]) -> ModelType:
        """Update an existing record."""
        update_data = obj_in
        for field, value in update_data.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Delete a record by ID."""
        obj = await self.get(db, id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

    async def get_by_field(self, db: AsyncSession, field_name: str, field_value: Any) -> Optional[ModelType]:
        """Retrieve a single record by a specific field and its value."""
        stmt = select(self.model).where(getattr(self.model, field_name) == field_value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_count(self, db: AsyncSession, filters: Optional[Dict[str, Any]] = None) -> int:
        """Get the count of records with optional filters."""
        stmt = select(self.model)
        if filters:
            for key, value in filters.items():
                stmt = stmt.where(getattr(self.model, key) == value)
        
        # Count the results
        count_stmt = select(func.count()).select_from(stmt.subquery())
        result = await db.execute(count_stmt)
        return result.scalar_one()

from sqlalchemy import func
from typing import TypeVar, Type, Generic, List, Optional, Dict, Any
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import Base # Import your Base class
from app.db.models import User # For specific relations/lookups if needed

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=Base)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=Base)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, obj_id: Any) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == obj_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, obj_in: CreateSchemaType) -> ModelType:
        db_obj = self.model(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, db_obj: ModelType, obj_in: UpdateSchemaType | Dict[str, Any]
    ) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, obj_id: Any) -> Optional[ModelType]:
        obj = await self.get(db, obj_id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj

    async def get_by_field(self, db: AsyncSession, field_name: str, field_value: Any) -> Optional[ModelType]:
        stmt = select(self.model).where(getattr(self.model, field_name) == field_value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi_by_field(self, db: AsyncSession, field_name: str, field_value: Any, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).where(getattr(self.model, field_name) == field_value).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

# Import all models for `crud` instances to be used in services
from app.db.models import User, Database, Metric, OptimizationSuggestion, Task, UserRole, DatabaseType, SuggestionType, TaskStatus
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.database import DatabaseCreate, DatabaseUpdate
from app.schemas.metric import MetricCreate, MetricUpdate
from app.schemas.suggestion import OptimizationSuggestionCreate, OptimizationSuggestionUpdate
from app.schemas.task import TaskCreate, TaskUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        return await self.get_by_field(db, "email", email)

    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        return await self.get_by_field(db, "username", username)

    async def create_with_hashed_password(self, db: AsyncSession, obj_in: UserCreate, hashed_password: str) -> User:
        db_obj = self.model(
            username=obj_in.username,
            email=obj_in.email,
            hashed_password=hashed_password,
            full_name=obj_in.full_name,
            is_active=obj_in.is_active,
            is_admin=obj_in.is_admin,
            role=obj_in.role
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

class CRUDDatabase(CRUDBase[Database, DatabaseCreate, DatabaseUpdate]):
    async def get_multi_by_owner(self, db: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100) -> List[Database]:
        stmt = select(self.model).where(self.model.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

class CRUDMetric(CRUDBase[Metric, MetricCreate, MetricUpdate]):
    async def get_multi_by_database(self, db: AsyncSession, database_id: int, skip: int = 0, limit: int = 100) -> List[Metric]:
        stmt = select(self.model).where(self.model.database_id == database_id).order_by(self.model.timestamp.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

class CRUDOptimizationSuggestion(CRUDBase[OptimizationSuggestion, OptimizationSuggestionCreate, OptimizationSuggestionUpdate]):
    async def get_multi_by_database(self, db: AsyncSession, database_id: int, skip: int = 0, limit: int = 100) -> List[OptimizationSuggestion]:
        stmt = select(self.model).where(self.model.database_id == database_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    async def get_multi_by_assignee(self, db: AsyncSession, assigned_to_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        stmt = select(self.model).where(self.model.assigned_to_id == assigned_to_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_multi_by_database(self, db: AsyncSession, database_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        stmt = select(self.model).where(self.model.database_id == database_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())


user = CRUDUser(User)
database = CRUDDatabase(Database)
metric = CRUDMetric(Metric)
suggestion = CRUDOptimizationSuggestion(OptimizationSuggestion)
task = CRUDTask(Task)
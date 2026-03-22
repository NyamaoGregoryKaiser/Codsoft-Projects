from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate


class CRUDItem(CRUDBase[Item, ItemCreate, ItemUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Item]:
        """Fetches multiple items owned by a specific user with pagination."""
        stmt = select(self.model).where(Item.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: ItemCreate, owner_id: int
    ) -> Item:
        """Creates a new item and associates it with an owner."""
        db_obj = self.model(
            title=obj_in.title,
            description=obj_in.description,
            owner_id=owner_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

item = CRUDItem(Item)
```
from typing import List
import pytest
from sqlalchemy import Column, Integer, String
from pydantic import BaseModel
from app.db.base import Base
from app.crud.base import CRUDBase

# Define a dummy SQLAlchemy model for testing
class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)

# Define dummy Pydantic schemas for the Item model
class ItemCreate(BaseModel):
    name: str
    description: str

class ItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

# Instantiate the CRUDBase for Item
crud_item = CRUDBase(Item)

@pytest.mark.asyncio
async def test_crud_create(db_session):
    item_in = ItemCreate(name="Test Item", description="A description")
    item = await crud_item.create(db_session, obj_in=item_in)
    assert item.id is not None
    assert item.name == "Test Item"
    assert item.description == "A description"

@pytest.mark.asyncio
async def test_crud_get(db_session):
    item_in = ItemCreate(name="Get Item", description="Another description")
    created_item = await crud_item.create(db_session, obj_in=item_in)
    
    fetched_item = await crud_item.get(db_session, created_item.id)
    assert fetched_item is not None
    assert fetched_item.id == created_item.id
    assert fetched_item.name == "Get Item"

    non_existent_item = await crud_item.get(db_session, 999)
    assert non_existent_item is None

@pytest.mark.asyncio
async def test_crud_get_multi(db_session):
    item1_in = ItemCreate(name="Item 1", description="Desc 1")
    item2_in = ItemCreate(name="Item 2", description="Desc 2")
    await crud_item.create(db_session, obj_in=item1_in)
    await crud_item.create(db_session, obj_in=item2_in)

    items = await crud_item.get_multi(db_session)
    assert len(items) >= 2 # Could be more if other tests leave data, but with rollback, it should be 2
    assert any(item.name == "Item 1" for item in items)
    assert any(item.name == "Item 2" for item in items)

    items_limited = await crud_item.get_multi(db_session, limit=1)
    assert len(items_limited) == 1

@pytest.mark.asyncio
async def test_crud_update(db_session):
    item_in = ItemCreate(name="Original Item", description="Original Desc")
    created_item = await crud_item.create(db_session, obj_in=item_in)

    update_in = ItemUpdate(name="Updated Item")
    updated_item = await crud_item.update(db_session, db_obj=created_item, obj_in=update_in)
    assert updated_item.name == "Updated Item"
    assert updated_item.description == "Original Desc" # Description should be unchanged

    update_in_dict = {"description": "New Desc"}
    updated_item_dict = await crud_item.update(db_session, db_obj=updated_item, obj_in=update_in_dict)
    assert updated_item_dict.name == "Updated Item"
    assert updated_item_dict.description == "New Desc"

@pytest.mark.asyncio
async def test_crud_remove(db_session):
    item_in = ItemCreate(name="Removable Item", description="To be deleted")
    created_item = await crud_item.create(db_session, obj_in=item_in)

    removed_item = await crud_item.remove(db_session, id=created_item.id)
    assert removed_item is not None
    assert removed_item.id == created_item.id

    fetched_item = await crud_item.get(db_session, created_item.id)
    assert fetched_item is None

    non_existent_remove = await crud_item.remove(db_session, id=999)
    assert non_existent_remove is None

@pytest.mark.asyncio
async def test_crud_count(db_session):
    await crud_item.create(db_session, obj_in=ItemCreate(name="Item C1", description="D1"))
    await crud_item.create(db_session, obj_in=ItemCreate(name="Item C2", description="D2"))
    
    count = await crud_item.count(db_session)
    assert count == 2 # Assuming clean slate due to fixture scope
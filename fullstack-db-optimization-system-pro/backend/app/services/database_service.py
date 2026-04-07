from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import crud
from app.db.models import User, Database
from app.schemas.database import DatabaseCreate, DatabaseUpdate
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from loguru import logger

class DatabaseService:
    async def get_database(self, db: AsyncSession, db_id: int) -> Database:
        db_instance = await crud.database.get(db, db_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {db_id} not found")
        return db_instance

    async def get_all_databases(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Database]:
        return await crud.database.get_multi(db, skip=skip, limit=limit)

    async def get_user_databases(self, db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Database]:
        return await crud.database.get_multi_by_owner(db, owner_id=user_id, skip=skip, limit=limit)

    async def create_database(self, db: AsyncSession, db_in: DatabaseCreate, current_user: User) -> Database:
        # Ensure the owner_id in the schema matches the current user for security
        if db_in.owner_id != current_user.id:
            if not current_user.is_admin:
                raise ForbiddenException("You can only create databases for yourself.")
            # If admin, ensure the target owner_id exists
            target_owner = await crud.user.get(db, db_in.owner_id)
            if not target_owner:
                raise NotFoundException(f"Owner user with ID {db_in.owner_id} not found.")

        # Check for duplicate database names for the same owner
        user_dbs = await self.get_user_databases(db, db_in.owner_id)
        for existing_db in user_dbs:
            if existing_db.name == db_in.name:
                raise ConflictException(f"Database with name '{db_in.name}' already exists for this user.")

        new_db = await crud.database.create(db, db_in)
        logger.info(f"User '{current_user.username}' created database: {new_db.name} (ID: {new_db.id})")
        return new_db

    async def update_database(self, db: AsyncSession, db_id: int, db_in: DatabaseUpdate, current_user: User) -> Database:
        db_instance = await self.get_database(db, db_id)

        # Ensure current user is the owner or an admin
        if db_instance.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You do not have permission to update this database.")

        updated_db = await crud.database.update(db, db_instance, db_in)
        logger.info(f"User '{current_user.username}' updated database: {updated_db.name} (ID: {updated_db.id})")
        return updated_db

    async def delete_database(self, db: AsyncSession, db_id: int, current_user: User) -> Database:
        db_instance = await self.get_database(db, db_id)

        # Ensure current user is the owner or an admin
        if db_instance.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You do not have permission to delete this database.")

        deleted_db = await crud.database.remove(db, db_id)
        logger.info(f"User '{current_user.username}' deleted database: {deleted_db.name} (ID: {deleted_db.id})")
        return deleted_db

database_service = DatabaseService()
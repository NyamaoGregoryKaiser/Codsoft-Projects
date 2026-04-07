from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import crud
from app.db.models import Task, Database, OptimizationSuggestion, User, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException, UnprocessableEntityException
from loguru import logger

class TaskService:
    async def get_task(self, db: AsyncSession, task_id: int) -> Task:
        task = await crud.task.get(db, task_id)
        if not task:
            raise NotFoundException(f"Optimization task with ID {task_id} not found")
        return task

    async def get_all_tasks(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Task]:
        return await crud.task.get_multi(db, skip=skip, limit=limit)

    async def get_user_tasks(self, db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        return await crud.task.get_multi_by_assignee(db, assigned_to_id=user_id, skip=skip, limit=limit)

    async def get_database_tasks(self, db: AsyncSession, database_id: int, current_user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        db_instance = await crud.database.get(db, database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {database_id} not found.")
        if db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to view tasks for this database.")

        return await crud.task.get_multi_by_database(db, database_id=database_id, skip=skip, limit=limit)

    async def create_task(self, db: AsyncSession, task_in: TaskCreate, current_user: User) -> Task:
        db_instance = await crud.database.get(db, task_in.database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {task_in.database_id} not found.")
        if db_instance.owner_id != current_user.id:
             raise ForbiddenException("You do not have permission to create tasks for this database.")

        if task_in.suggestion_id:
            suggestion = await crud.suggestion.get(db, task_in.suggestion_id)
            if not suggestion:
                raise NotFoundException(f"Optimization suggestion with ID {task_in.suggestion_id} not found.")
            if suggestion.database_id != task_in.database_id:
                raise UnprocessableEntityException("Suggestion does not belong to the specified database.")
            
            # Check if a task already exists for this suggestion
            existing_task_for_suggestion = await crud.task.get_by_field(db, "suggestion_id", task_in.suggestion_id)
            if existing_task_for_suggestion:
                raise ConflictException(f"A task already exists for suggestion ID {task_in.suggestion_id}.")
            
        if task_in.assigned_to_id:
            assignee = await crud.user.get(db, task_in.assigned_to_id)
            if not assignee:
                raise NotFoundException(f"Assigned user with ID {task_in.assigned_to_id} not found.")
        else:
            task_in.assigned_to_id = current_user.id # Assign to creator if not specified

        new_task = await crud.task.create(db, task_in)
        logger.info(f"User '{current_user.username}' created optimization task (ID: {new_task.id}) for database ID: {new_task.database_id}")
        return new_task

    async def update_task(self, db: AsyncSession, task_id: int, task_in: TaskUpdate, current_user: User) -> Task:
        db_task = await self.get_task(db, task_id)

        # Check ownership of the task's database or if assigned to current user or admin
        db_instance = await crud.database.get(db, db_task.database_id)
        is_owner = db_instance and db_instance.owner_id == current_user.id
        is_assignee = db_task.assigned_to_id == current_user.id
        is_admin = current_user.is_admin

        if not (is_owner or is_assignee or is_admin):
             raise ForbiddenException("You do not have permission to update this task.")

        if task_in.assigned_to_id and task_in.assigned_to_id != db_task.assigned_to_id:
            new_assignee = await crud.user.get(db, task_in.assigned_to_id)
            if not new_assignee:
                raise NotFoundException(f"New assignee user with ID {task_in.assigned_to_id} not found.")

        updated_task = await crud.task.update(db, db_task, task_in)
        logger.info(f"User '{current_user.username}' updated optimization task (ID: {updated_task.id}) for database ID: {updated_task.database_id}")
        return updated_task

    async def delete_task(self, db: AsyncSession, task_id: int, current_user: User) -> Task:
        db_task = await self.get_task(db, task_id)

        # Check ownership of the task's database or admin
        db_instance = await crud.database.get(db, db_task.database_id)
        if not ( (db_instance and db_instance.owner_id == current_user.id) or current_user.is_admin ):
             raise ForbiddenException("You do not have permission to delete this task.")

        deleted_task = await crud.task.remove(db, task_id)
        logger.info(f"User '{current_user.username}' deleted optimization task (ID: {deleted_task.id}) for database ID: {deleted_task.database_id}")
        return deleted_task

task_service = TaskService()
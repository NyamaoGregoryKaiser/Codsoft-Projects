from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload, aliased

from app.crud.base import CRUDBase
from app.models.project import Project
from app.models.task import Task
from app.schemas.project import ProjectCreate, ProjectUpdate

class CRUDProject(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Project]:
        result = await db.execute(
            select(self.model)
            .filter(Project.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .options(selectinload(Project.owner)) # Eager load owner
        )
        return result.scalars().all()

    async def get_with_owner(self, db: AsyncSession, *, project_id: int) -> Optional[Project]:
        result = await db.execute(
            select(self.model)
            .filter(Project.id == project_id)
            .options(joinedload(Project.owner))
        )
        return result.scalar_one_or_none()

    async def get_project_details(self, db: AsyncSession, *, project_id: int) -> Optional[Project]:
        """
        Retrieves a project with its owner and a count of its tasks.
        """
        result = await db.execute(
            select(Project)
            .filter(Project.id == project_id)
            .options(joinedload(Project.owner))
        )
        project = result.scalar_one_or_none()

        if project:
            # Manually count tasks for demonstration.
            # In a real app, this might be a more complex query or pre-calculated.
            task_count_result = await db.execute(
                select(Task).filter(Task.project_id == project_id)
            )
            project.tasks_count = len(task_count_result.scalars().all()) # This is inefficient, better to use count() in query
        
        return project

    async def get_projects_with_tasks_count(self, db: AsyncSession, *, skip: int = 0, limit: int = 100, owner_id: Optional[int] = None) -> List[Project]:
        """
        Retrieves multiple projects with their owners and includes a count of their tasks.
        """
        query = select(Project).options(joinedload(Project.owner))
        if owner_id:
            query = query.filter(Project.owner_id == owner_id)

        # Execute the main project query
        projects_result = await db.execute(
            query.offset(skip).limit(limit)
        )
        projects = projects_result.scalars().all()

        # Optimize: Batch load task counts for all fetched projects
        project_ids = [p.id for p in projects]
        if project_ids:
            task_counts_result = await db.execute(
                select(Task.project_id, Task.id) # Only select IDs to reduce data transfer
                .filter(Task.project_id.in_(project_ids))
            )
            # Aggregate counts
            task_counts = {}
            for project_id, _ in task_counts_result:
                task_counts[project_id] = task_counts.get(project_id, 0) + 1
            
            for project in projects:
                project.tasks_count = task_counts.get(project.id, 0)

        return projects


project = CRUDProject(Project)
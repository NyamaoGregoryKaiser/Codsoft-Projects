import re
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import crud
from app.db.models import OptimizationSuggestion, Database, User, SuggestionType
from app.schemas.suggestion import OptimizationSuggestionCreate, OptimizationSuggestionUpdate
from app.core.exceptions import NotFoundException, ForbiddenException, UnprocessableEntityException
from loguru import logger

class SuggestionService:
    async def get_suggestion(self, db: AsyncSession, suggestion_id: int) -> OptimizationSuggestion:
        suggestion = await crud.suggestion.get(db, suggestion_id)
        if not suggestion:
            raise NotFoundException(f"Optimization suggestion with ID {suggestion_id} not found")
        return suggestion

    async def get_database_suggestions(self, db: AsyncSession, database_id: int, current_user_id: int, skip: int = 0, limit: int = 100) -> List[OptimizationSuggestion]:
        db_instance = await crud.database.get(db, database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {database_id} not found.")
        if db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to view suggestions for this database.")

        return await crud.suggestion.get_multi_by_database(db, database_id=database_id, skip=skip, limit=limit)

    async def create_suggestion(self, db: AsyncSession, suggestion_in: OptimizationSuggestionCreate, current_user: User) -> OptimizationSuggestion:
        db_instance = await crud.database.get(db, suggestion_in.database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {suggestion_in.database_id} not found.")
        if db_instance.owner_id != current_user.id:
             raise ForbiddenException("You do not have permission to create suggestions for this database.")
        
        # Ensure suggested_by_id is the current user
        suggestion_in.suggested_by_id = current_user.id

        new_suggestion = await crud.suggestion.create(db, suggestion_in)
        logger.info(f"User '{current_user.username}' created optimization suggestion (ID: {new_suggestion.id}) for database ID: {new_suggestion.database_id}")
        return new_suggestion

    async def update_suggestion(self, db: AsyncSession, suggestion_id: int, suggestion_in: OptimizationSuggestionUpdate, current_user: User) -> OptimizationSuggestion:
        db_suggestion = await self.get_suggestion(db, suggestion_id)

        # Check ownership of the suggestion's database
        db_instance = await crud.database.get(db, db_suggestion.database_id)
        if not db_instance or db_instance.owner_id != current_user.id:
             raise ForbiddenException("You do not have permission to update this suggestion.")
        
        # Only admins or the suggester can approve/modify
        if suggestion_in.is_approved is not None and not current_user.is_admin:
            raise ForbiddenException("Only administrators can approve/disapprove suggestions.")

        updated_suggestion = await crud.suggestion.update(db, db_suggestion, suggestion_in)
        logger.info(f"User '{current_user.username}' updated optimization suggestion (ID: {updated_suggestion.id}) for database ID: {updated_suggestion.database_id}")
        return updated_suggestion

    async def delete_suggestion(self, db: AsyncSession, suggestion_id: int, current_user: User) -> OptimizationSuggestion:
        db_suggestion = await self.get_suggestion(db, suggestion_id)

        # Check ownership of the suggestion's database
        db_instance = await crud.database.get(db, db_suggestion.database_id)
        if not db_instance or db_instance.owner_id != current_user.id:
             raise ForbiddenException("You do not have permission to delete this suggestion.")
        
        # Optionally restrict deletion if task is linked or suggestion is approved
        if db_suggestion.is_approved and not current_user.is_admin:
            raise ForbiddenException("Approved suggestions can only be deleted by an administrator.")

        deleted_suggestion = await crud.suggestion.remove(db, suggestion_id)
        logger.info(f"User '{current_user.username}' deleted optimization suggestion (ID: {deleted_suggestion.id}) for database ID: {deleted_suggestion.database_id}")
        return deleted_suggestion

    async def analyze_slow_queries(self, db: AsyncSession, database_id: int, current_user: User) -> List[OptimizationSuggestion]:
        db_instance = await crud.database.get(db, database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {database_id} not found.")
        if db_instance.owner_id != current_user.id:
             raise ForbiddenException("You do not have permission to analyze queries for this database.")
        
        # Retrieve recent metrics with slow queries
        recent_metrics = await crud.metric.get_multi_by_database(db, database_id=database_id, limit=10)
        
        new_suggestions = []
        for metric in recent_metrics:
            if metric.slow_queries_json and metric.slow_queries_json.get("examples"):
                for query_example in metric.slow_queries_json["examples"]:
                    # Simple regex-based analysis for demonstration
                    # Rule 1: Detect SELECT queries with WHERE clauses that might need an index
                    match = re.search(r"SELECT\s+.*?\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*['\"].*?['\"]", query_example, re.IGNORECASE)
                    if match:
                        table_name = match.group(1)
                        column_name = match.group(2)
                        
                        description = f"Consider creating an index on column '{column_name}' in table '{table_name}' for query: '{query_example[:100]}...'"
                        sql_command = f"CREATE INDEX idx_{table_name}_{column_name} ON {table_name} ({column_name});"
                        
                        # Check if a similar suggestion already exists to avoid duplicates
                        existing_suggestions = await self.get_database_suggestions(db, database_id, current_user.id, limit=50) # Limited check
                        is_duplicate = any(s.sql_command == sql_command for s in existing_suggestions)
                        
                        if not is_duplicate:
                            suggestion_data = OptimizationSuggestionCreate(
                                database_id=database_id,
                                suggested_by_id=current_user.id,
                                suggestion_type=SuggestionType.INDEX,
                                description=description,
                                sql_command=sql_command,
                                impact_estimate="High"
                            )
                            new_suggestions.append(await crud.suggestion.create(db, suggestion_data))
                            logger.info(f"Generated new index suggestion for DB {database_id}: {sql_command}")
                            
                    # Add more analysis rules here (e.g., for JOINs, configuration, etc.)
        
        if not new_suggestions:
            logger.info(f"No new optimization suggestions generated for database ID: {database_id}")
        return new_suggestions

suggestion_service = SuggestionService()
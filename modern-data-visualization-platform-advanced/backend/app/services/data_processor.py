```python
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import text
import pandas as pd
import httpx # For API data sources

from app.models.datasource import DataSource, DataSourceType
from app.models.chart import Chart
from app.core.caching import cache_data, invalidate_cache
from app.core.config import settings

logger = logging.getLogger(__name__)

class DataProcessorService:
    """
    Handles connecting to various data sources, executing queries,
    and processing raw data into a format suitable for visualization.
    Includes caching for query results.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    @cache_data(key_prefix="visuflow:data")
    async def get_chart_data(self, chart_id: int, query_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Retrieves data for a specific chart, using its associated data source and query.
        Caches the result.
        """
        chart = await self.db.get(Chart, chart_id)
        if not chart:
            raise ValueError(f"Chart with ID {chart_id} not found.")

        data_source = await self.db.get(DataSource, chart.data_source_id)
        if not data_source:
            raise ValueError(f"Data Source with ID {chart.data_source_id} not found for chart {chart_id}.")

        logger.info(f"Fetching data for chart '{chart.title}' from data source '{data_source.name}' ({data_source.type}).")

        # Combine chart-specific query_params with any runtime parameters
        effective_query_params = {**(chart.query_params or {}), **(query_params or {})}

        data = []
        try:
            if data_source.type in [DataSourceType.POSTGRESQL, DataSourceType.MYSQL, DataSourceType.SQLSERVER]:
                data = await self._query_relational_db(data_source, chart.query, effective_query_params)
            elif data_source.type == DataSourceType.API:
                data = await self._query_api_source(data_source, chart.query, effective_query_params)
            elif data_source.type == DataSourceType.S3:
                data = await self._query_s3_source(data_source, chart.query, effective_query_params)
            elif data_source.type == DataSourceType.GOOGLE_SHEETS:
                data = await self._query_google_sheets(data_source, chart.query, effective_query_params)
            else:
                raise NotImplementedError(f"Data source type '{data_source.type}' not supported.")
        except Exception as e:
            logger.error(f"Failed to fetch data for chart {chart_id}: {e}", exc_info=True)
            raise RuntimeError(f"Data fetching failed: {e}")

        logger.info(f"Successfully fetched {len(data)} records for chart '{chart.title}'.")
        return data

    async def invalidate_chart_data_cache(self, chart_id: int):
        """Invalidates the cache for a specific chart's data."""
        await invalidate_cache(key_prefix="visuflow:data", pattern=f"get_chart_data:{chart_id}:*")
        logger.info(f"Invalidated cache for chart ID {chart_id}")

    async def test_data_source_connection(self, data_source: DataSource) -> bool:
        """
        Tests the connection to a given data source.
        """
        logger.info(f"Testing connection for data source: {data_source.name} ({data_source.type})")
        try:
            if data_source.type in [DataSourceType.POSTGRESQL, DataSourceType.MYSQL, DataSourceType.SQLSERVER]:
                # Use a simple SELECT 1 to test connection
                test_query = "SELECT 1"
                # Need to use a different engine for the connection string to avoid
                # interfering with the main app DB session.
                # In a real app, you might have a dedicated connection pool for external sources.
                temp_engine = create_async_engine(data_source.connection_string, future=True, echo=False, pool_size=1)
                async with temp_engine.connect() as conn:
                    await conn.execute(text(test_query))
                await temp_engine.dispose()
                return True
            elif data_source.type == DataSourceType.API:
                # Attempt a simple GET request to the base URL
                async with httpx.AsyncClient() as client:
                    response = await client.get(data_source.connection_string, timeout=10)
                    response.raise_for_status() # Raise for bad status codes
                return True
            # Add checks for other data source types (S3, Google Sheets, etc.)
            else:
                logger.warning(f"Connection test not implemented for data source type: {data_source.type}")
                return False
        except Exception as e:
            logger.error(f"Failed to connect to data source {data_source.name}: {e}")
            return False

    async def _query_relational_db(self, data_source: DataSource, query: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Executes a SQL query against a relational database.
        """
        if not data_source.connection_string:
            raise ValueError("Relational database data source must have a connection string.")

        # Create a new engine for the external data source
        engine = create_async_engine(data_source.connection_string, future=True, echo=False, pool_size=1)
        data = []
        try:
            async with engine.connect() as conn:
                result = await conn.execute(text(query), params)
                for row in result:
                    # Convert row to dictionary, handling datetime objects for JSON serialization
                    row_dict = dict(row._mapping)
                    for k, v in row_dict.items():
                        if isinstance(v, datetime):
                            row_dict[k] = v.isoformat()
                    data.append(row_dict)
        except Exception as e:
            logger.error(f"Error querying relational DB: {e}", exc_info=True)
            raise
        finally:
            await engine.dispose() # Dispose engine after use
        return data

    async def _query_api_source(self, data_source: DataSource, endpoint_path: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetches data from an API data source.
        `query` parameter here is interpreted as an endpoint path.
        `config` in DataSource can contain headers, authentication info.
        """
        if not data_source.connection_string:
            raise ValueError("API data source must have a base URL.")

        base_url = data_source.connection_string.rstrip('/')
        full_url = f"{base_url}{endpoint_path}"
        headers = data_source.config.get("headers", {}) if data_source.config else {}
        auth = data_source.config.get("auth") # Could be bearer token, basic auth etc.

        async with httpx.AsyncClient() as client:
            response = await client.get(full_url, params=params, headers=headers, timeout=30) # Add auth here if needed
            response.raise_for_status()
            return response.json()

    async def _query_s3_source(self, data_source: DataSource, file_path: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetches data from an S3 bucket. `query` parameter here is the S3 key/file path.
        `config` might include bucket name, AWS credentials (though not recommended directly).
        """
        # This is a simplified example. A real implementation would use aiobotocore.
        # Ensure 'config' contains necessary details like bucket_name and maybe region.
        # For security, AWS credentials should come from environment variables or IAM roles.
        if not settings.TESTING: # Skip real S3 interaction during tests if not mocked
            logger.warning("S3 data source not fully implemented/mocked for direct fetching.")
            raise NotImplementedError("S3 data fetching requires aiobotocore and proper AWS config.")
        
        # Mock data for demonstration
        mock_data = [
            {"category": "A", "value": 100},
            {"category": "B", "value": 150},
            {"category": "C", "value": 75},
        ]
        return mock_data

    async def _query_google_sheets(self, data_source: DataSource, sheet_name_or_range: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetches data from Google Sheets. `query` parameter here is the sheet name or range.
        `config` must contain Google API credentials (e.g., service account key JSON).
        """
        # This requires google-api-python-client, google-auth-httplib2, google-auth-oauthlib
        # For security, credentials should be handled carefully (e.g., loaded from environment or secret management).
        if not settings.TESTING:
            logger.warning("Google Sheets data source not fully implemented/mocked for direct fetching.")
            raise NotImplementedError("Google Sheets data fetching requires Google API client and credentials.")

        # Mock data for demonstration
        mock_data = [
            {"product": "Laptop", "sales": 1200},
            {"product": "Mouse", "sales": 300},
            {"product": "Keyboard", "sales": 500},
        ]
        return mock_data
```
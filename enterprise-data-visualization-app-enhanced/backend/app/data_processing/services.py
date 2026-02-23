```python
import pandas as pd
from sqlalchemy import create_engine, text
from werkzeug.exceptions import BadRequest, InternalServerError
from backend.app.models import DataSource
from backend.app.extensions import cache
import io
import csv

class DataProcessingService:
    @staticmethod
    def _get_db_connection(data_source: DataSource):
        """Establishes a database connection using SQLAlchemy engine."""
        # IMPORTANT: In a real application, connection_string would be decrypted here.
        if data_source.type == 'postgresql':
            # Example: 'postgresql://user:password@host:port/dbname'
            return create_engine(data_source.connection_string)
        elif data_source.type == 'mysql':
            # Example: 'mysql+mysqlconnector://user:password@host:port/dbname'
            return create_engine(data_source.connection_string)
        else:
            raise BadRequest(f"Unsupported database type: {data_source.type}")

    @staticmethod
    @cache.memoize(timeout=300) # Cache query results for 5 minutes
    def execute_query(data_source_id: int, user_id: int, query_string: str) -> dict:
        """
        Executes a query against a specified data source and returns results.
        Supports caching of results.
        """
        data_source = DataSource.query.filter_by(id=data_source_id, user_id=user_id).first()
        if not data_source:
            raise BadRequest("Data source not found or unauthorized.")

        if data_source.type in ['postgresql', 'mysql']:
            try:
                engine = DataProcessingService._get_db_connection(data_source)
                # Using pandas read_sql to execute query and get DataFrame
                df = pd.read_sql(text(query_string), engine)
                return df.to_dict(orient='records')
            except Exception as e:
                raise InternalServerError(f"Database query failed: {e}")
        elif data_source.type == 'csv':
            # For CSV, the "connection_string" is expected to be the CSV content itself
            # or a URL to a CSV file. For simplicity, we assume content here.
            try:
                df = pd.read_csv(io.StringIO(data_source.connection_string))
                # Apply simple SQL-like filtering if query_string is like "SELECT * WHERE col = 'value'"
                # This is a very basic example; a full SQL parser for CSV is complex.
                # For this example, we'll just return the whole CSV if no specific query logic is parsed.
                # In a real system, you might integrate something like DuckDB for SQL on files.
                return df.to_dict(orient='records')
            except Exception as e:
                raise InternalServerError(f"CSV data processing failed: {e}")
        else:
            raise BadRequest(f"Unsupported data source type for query execution: {data_source.type}")

    @staticmethod
    def get_data_source_columns(data_source_id: int, user_id: int, table_name: str) -> list:
        """
        Fetches column names and types for a given table in a data source.
        This is useful for building query UIs.
        """
        data_source = DataSource.query.filter_by(id=data_source_id, user_id=user_id).first()
        if not data_source:
            raise BadRequest("Data source not found or unauthorized.")

        if data_source.type in ['postgresql', 'mysql']:
            try:
                engine = DataProcessingService._get_db_connection(data_source)
                if data_source.type == 'postgresql':
                    query = f"""
                        SELECT column_name, data_type
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = '{table_name}';
                    """
                elif data_source.type == 'mysql':
                    query = f"""
                        SELECT column_name, data_type
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE() AND table_name = '{table_name}';
                    """
                with engine.connect() as connection:
                    result = connection.execute(text(query)).fetchall()
                    return [{"column_name": r[0], "data_type": r[1]} for r in result]
            except Exception as e:
                raise InternalServerError(f"Failed to fetch table columns: {e}")
        elif data_source.type == 'csv':
            try:
                # For CSV, assume the first row are headers and all are 'text' for simplicity
                df = pd.read_csv(io.StringIO(data_source.connection_string))
                return [{"column_name": col, "data_type": str(df[col].dtype)} for col in df.columns]
            except Exception as e:
                raise InternalServerError(f"Failed to parse CSV columns: {e}")
        else:
            raise BadRequest(f"Unsupported data source type for column fetching: {data_source.type}")

    @staticmethod
    def get_data_source_tables(data_source_id: int, user_id: int) -> list:
        """Fetches list of tables/collections available in a data source."""
        data_source = DataSource.query.filter_by(id=data_source_id, user_id=user_id).first()
        if not data_source:
            raise BadRequest("Data source not found or unauthorized.")

        if data_source.type in ['postgresql', 'mysql']:
            try:
                engine = DataProcessingService._get_db_connection(data_source)
                if data_source.type == 'postgresql':
                    query = "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';"
                elif data_source.type == 'mysql':
                    query = "SHOW TABLES;"
                with engine.connect() as connection:
                    result = connection.execute(text(query)).fetchall()
                    return [r[0] for r in result]
            except Exception as e:
                raise InternalServerError(f"Failed to fetch tables: {e}")
        elif data_source.type == 'csv':
            # For CSV, consider the file itself as a "table"
            return ['default_csv_table'] # Or parse filename if URL based
        else:
            raise BadRequest(f"Unsupported data source type for table fetching: {data_source.type}")

```
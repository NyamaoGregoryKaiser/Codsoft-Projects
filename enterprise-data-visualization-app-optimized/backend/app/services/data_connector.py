```python
import pandas as pd
from sqlalchemy import create_engine, text
from flask import current_app
import logging

class DataConnector:
    """
    Connects to various data sources and fetches raw data.
    Implements a factory pattern or strategy pattern based on data source type.
    """
    def __init__(self, db_type: str, connection_params: dict):
        self.db_type = db_type.lower()
        self.connection_params = connection_params
        self.engine = None

    def _get_sqlalchemy_engine(self):
        """Creates a SQLAlchemy engine for SQL-based data sources."""
        if self.db_type == 'postgresql':
            conn_str = f"postgresql://{self.connection_params['user']}:{self.connection_params['password']}@{self.connection_params['host']}:{self.connection_params['port']}/{self.connection_params['dbname']}"
        elif self.db_type == 'mysql':
            conn_str = f"mysql+pymysql://{self.connection_params['user']}:{self.connection_params['password']}@{self.connection_params['host']}:{self.connection_params['port']}/{self.connection_params['dbname']}"
        elif self.db_type == 'sqlite':
            conn_str = f"sqlite:///{self.connection_params['path']}"
        else:
            raise ValueError(f"Unsupported SQL database type: {self.db_type}")
        return create_engine(conn_str)

    def test_connection(self) -> bool:
        """Tests the connection to the data source."""
        current_app.logger.info(f"Testing connection for data source type: {self.db_type}")
        try:
            if self.db_type in ['postgresql', 'mysql', 'sqlite']:
                engine = self._get_sqlalchemy_engine()
                with engine.connect() as connection:
                    connection.execute(text("SELECT 1")) # Simple query to test connection
                return True
            elif self.db_type == 'csv':
                # For CSV, just check if the file path is accessible and readable
                file_path = self.connection_params.get('path')
                if not file_path:
                    raise ValueError("CSV path not provided in connection parameters.")
                # Try to open and close the file
                with open(file_path, 'r') as f:
                    pass
                return True
            elif self.db_type == 'api':
                import requests # Import here to avoid dependency if not needed
                response = requests.get(self.connection_params['url'], timeout=5)
                response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
                return True
            else:
                raise ValueError(f"Unsupported data source type for connection test: {self.db_type}")
        except Exception as e:
            current_app.logger.error(f"Connection test failed for {self.db_type}: {e}", exc_info=True)
            raise ConnectionError(f"Failed to connect to {self.db_type}: {e}")

    def fetch_data(self, query_config: dict) -> tuple[list[dict], list[str]]:
        """
        Fetches data from the configured data source based on query_config.
        Returns a list of dictionaries (rows) and a list of column names.
        """
        current_app.logger.info(f"Fetching data from data source type: {self.db_type}")
        try:
            if self.db_type in ['postgresql', 'mysql', 'sqlite']:
                engine = self._get_sqlalchemy_engine()
                sql_query = query_config.get('sql_query')
                if not sql_query:
                    raise ValueError("SQL query not provided in query_config for SQL data source.")

                # IMPORTANT: Implement robust SQL injection prevention here!
                # Prefer parameterized queries or a query builder that escapes inputs.
                # For simplicity here, we assume queries are already validated/sanitized
                # on the API layer or by a more sophisticated query builder in production.
                # Example: data = pd.read_sql(text(sql_query), engine, params=query_config.get('params', {}))
                data = pd.read_sql(text(sql_query), engine)
                return data.to_dict(orient='records'), data.columns.tolist()
            elif self.db_type == 'csv':
                file_path = self.connection_params.get('path')
                if not file_path:
                    raise ValueError("CSV path not provided in connection parameters.")
                data = pd.read_csv(file_path)
                # Apply filters or transformations if specified in query_config
                # e.g., filters = query_config.get('filters', {})
                return data.to_dict(orient='records'), data.columns.tolist()
            elif self.db_type == 'api':
                import requests
                api_url = self.connection_params.get('url')
                endpoint = query_config.get('endpoint', '')
                params = query_config.get('params', {})
                headers = query_config.get('headers', {})
                method = query_config.get('method', 'GET').upper()
                body = query_config.get('body')

                full_url = f"{api_url}{endpoint}" if endpoint else api_url

                if method == 'GET':
                    response = requests.get(full_url, params=params, headers=headers, timeout=10)
                elif method == 'POST':
                    response = requests.post(full_url, json=body, params=params, headers=headers, timeout=10)
                else:
                    raise ValueError(f"Unsupported API method: {method}")

                response.raise_for_status()
                json_data = response.json()

                # API responses can be varied; we might need more logic here
                # to extract the actual data list if it's nested (e.g., {'results': [...]})
                if isinstance(json_data, dict) and 'data' in json_data: # Common pattern
                    data = pd.DataFrame(json_data['data'])
                elif isinstance(json_data, list):
                    data = pd.DataFrame(json_data)
                else:
                    data = pd.DataFrame([json_data]) # Wrap single object in list

                return data.to_dict(orient='records'), data.columns.tolist()
            else:
                raise ValueError(f"Unsupported data source type for data fetching: {self.db_type}")
        except Exception as e:
            current_app.logger.error(f"Failed to fetch data from {self.db_type}: {e}", exc_info=True)
            raise ConnectionError(f"Failed to fetch data: {e}")

```
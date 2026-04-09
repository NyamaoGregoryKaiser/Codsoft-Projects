```python
import logging
import pandas as pd
from typing import Any, Dict, List, Optional
from app.services.data_connector import data_connector
from app.db.models import DataSource, Dataset
from app.schemas.data_source import DataSourceType, DBType
from app.core.exceptions import BadRequestException, CustomException

logger = logging.getLogger(__name__)

class QueryExecutor:
    """
    Executes queries on datasets, applying filters and processing rules.
    """
    def __init__(self):
        pass

    async def get_dataset_data(self, dataset: Dataset) -> pd.DataFrame:
        """
        Retrieves raw data for a dataset, then applies filters and processing.
        """
        if not dataset.data_source:
            raise CustomException(500, f"Data source not found for dataset {dataset.name}")

        df = await data_connector.get_data(
            data_source_type=dataset.data_source.type,
            db_type=dataset.data_source.db_type,
            connection_string=str(dataset.data_source.connection_string) if dataset.data_source.connection_string else None,
            query=dataset.query or "", # Query could be SQL, file path, API endpoint
            config=dataset.data_source.config or {}
        )

        df = self._apply_filters(df, dataset.filters)
        df = self._apply_processing_config(df, dataset.processing_config)

        return df

    def _apply_filters(self, df: pd.DataFrame, filters: Optional[List[Dict[str, Any]]]) -> pd.DataFrame:
        """Applies filters to the DataFrame."""
        if not filters:
            return df

        try:
            for f in filters:
                field = f.get("field")
                operator = f.get("operator")
                value = f.get("value")

                if not all([field, operator, value is not None]):
                    logger.warning(f"Invalid filter skipped: {f}")
                    continue

                if field not in df.columns:
                    logger.warning(f"Filter field '{field}' not found in DataFrame. Skipping filter.")
                    continue

                # Basic type conversion for comparison
                # TODO: More robust type handling
                if isinstance(value, str):
                    df_series = df[field].astype(str)
                else:
                    try:
                        df_series = df[field].astype(type(value))
                    except Exception as e:
                        logger.warning(f"Could not cast column '{field}' to type of filter value '{value}'. Using original type. Error: {e}")
                        df_series = df[field]

                if operator == "=":
                    df = df[df_series == value]
                elif operator == "!=":
                    df = df[df_series != value]
                elif operator == ">":
                    df = df[df_series > value]
                elif operator == "<":
                    df = df[df_series < value]
                elif operator == ">=":
                    df = df[df_series >= value]
                elif operator == "<=":
                    df = df[df_series <= value]
                elif operator == "in":
                    if isinstance(value, list):
                        df = df[df_series.isin(value)]
                    else:
                        logger.warning(f"'in' operator requires a list value. Skipping filter: {f}")
                elif operator == "contains":
                    df = df[df_series.str.contains(str(value), na=False)]
                else:
                    logger.warning(f"Unsupported filter operator '{operator}'. Skipping filter: {f}")
            return df
        except Exception as e:
            logger.error(f"Error applying filters: {e}", exc_info=True)
            raise BadRequestException(f"Error applying filters to dataset: {e}")

    def _apply_processing_config(self, df: pd.DataFrame, config: Optional[Dict[str, Any]]) -> pd.DataFrame:
        """Applies processing rules (e.g., aggregations, column renaming) to the DataFrame."""
        if not config:
            return df

        try:
            # Column Renaming
            if "rename_columns" in config:
                df = df.rename(columns=config["rename_columns"])

            # Aggregations
            if "aggregations" in config:
                group_by_cols = config["aggregations"].get("group_by", [])
                agg_operations = config["aggregations"].get("operations", {}) # {"column": "sum/mean/count"}

                if group_by_cols and agg_operations:
                    agg_dict = {col: op for col, op in agg_operations.items() if col in df.columns}
                    if agg_dict:
                        df = df.groupby(group_by_cols).agg(agg_dict).reset_index()
                    else:
                        logger.warning("No valid aggregation operations found for specified columns.")
                elif agg_operations: # If no group_by, apply to entire dataframe
                    for col, op in agg_operations.items():
                        if col in df.columns:
                            if op == 'sum': df[col] = df[col].sum()
                            elif op == 'mean': df[col] = df[col].mean()
                            elif op == 'count': df[col] = df[col].count()
                            # ... more operations
                        else:
                            logger.warning(f"Aggregation column '{col}' not found in DataFrame.")

            # Other processing steps (e.g., pivot, melt, data type conversion, feature engineering) can be added here
            if "convert_types" in config:
                for col, dtype in config["convert_types"].items():
                    if col in df.columns:
                        try:
                            df[col] = df[col].astype(dtype)
                        except Exception as e:
                            logger.warning(f"Could not convert column '{col}' to '{dtype}'. Error: {e}")

            return df
        except Exception as e:
            logger.error(f"Error applying processing config: {e}", exc_info=True)
            raise BadRequestException(f"Error applying processing config to dataset: {e}")

query_executor = QueryExecutor()
```
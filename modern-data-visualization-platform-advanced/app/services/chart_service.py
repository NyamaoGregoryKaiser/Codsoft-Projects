from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd

from app.crud.chart import chart as crud_chart
from app.crud.dataset import dataset as crud_dataset
from app.models.chart import Chart
from app.schemas.chart import ChartCreate, ChartUpdate, Chart as ChartSchema
from app.core.exceptions import HTTPException
from app.services.dataset_service import dataset_service

class ChartService:
    async def create_chart(self, db: AsyncSession, obj_in: ChartCreate, owner_id: int) -> Chart:
        # Validate dataset existence and ownership
        dataset = await crud_dataset.get(db, obj_in.dataset_id)
        if not dataset or dataset.owner_id != owner_id:
            raise HTTPException(status_code=400, detail="Dataset not found or unauthorized for this user")
        
        # Optionally validate dashboard existence and ownership if dashboard_id is provided
        if obj_in.dashboard_id:
            from app.crud.dashboard import dashboard as crud_dashboard
            dashboard = await crud_dashboard.get(db, obj_in.dashboard_id)
            if not dashboard or dashboard.owner_id != owner_id:
                raise HTTPException(status_code=400, detail="Dashboard not found or unauthorized for this user")

        return await crud_chart.create(db, obj_in=obj_in, owner_id=owner_id)

    async def get_chart(self, db: AsyncSession, chart_id: int, owner_id: int) -> Optional[Chart]:
        db_chart = await crud_chart.get(db, chart_id)
        if not db_chart or db_chart.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Chart not found or unauthorized")
        return db_chart

    async def get_charts_by_owner(self, db: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100) -> List[Chart]:
        return await crud_chart.get_multi_by_owner(db, owner_id=owner_id, skip=skip, limit=limit)

    async def get_charts_by_dashboard(self, db: AsyncSession, dashboard_id: int, owner_id: int, skip: int = 0, limit: int = 100) -> List[Chart]:
        # Ensure dashboard exists and belongs to the user
        from app.services.dashboard_service import dashboard_service # avoid circular import
        await dashboard_service.get_dashboard(db, dashboard_id, owner_id)
        return await crud_chart.get_multi_by_dashboard(db, dashboard_id=dashboard_id, skip=skip, limit=limit)


    async def update_chart(self, db: AsyncSession, chart_id: int, obj_in: ChartUpdate, owner_id: int) -> Chart:
        db_chart = await self.get_chart(db, chart_id, owner_id) # Ensures ownership check

        # Re-validate dataset/dashboard if updated
        if obj_in.dataset_id and obj_in.dataset_id != db_chart.dataset_id:
            dataset = await crud_dataset.get(db, obj_in.dataset_id)
            if not dataset or dataset.owner_id != owner_id:
                raise HTTPException(status_code=400, detail="New dataset not found or unauthorized")
        if obj_in.dashboard_id and obj_in.dashboard_id != db_chart.dashboard_id:
            from app.crud.dashboard import dashboard as crud_dashboard
            dashboard = await crud_dashboard.get(db, obj_in.dashboard_id)
            if not dashboard or dashboard.owner_id != owner_id:
                raise HTTPException(status_code=400, detail="New dashboard not found or unauthorized")
            
        return await crud_chart.update(db, db_obj=db_chart, obj_in=obj_in)

    async def delete_chart(self, db: AsyncSession, chart_id: int, owner_id: int) -> Chart:
        db_chart = await self.get_chart(db, chart_id, owner_id) # Ensures ownership check
        deleted_chart = await crud_chart.delete(db, id=chart_id)
        if not deleted_chart:
            raise HTTPException(status_code=404, detail="Chart not found")
        return deleted_chart

    async def get_chart_data(self, db: AsyncSession, chart_id: int, owner_id: int) -> Dict[str, Any]:
        """
        Retrieves raw data for a chart and applies basic transformations
        based on chart_type and config to return a format suitable for frontend charting library.
        """
        db_chart = await self.get_chart(db, chart_id, owner_id)
        
        # Get raw data from the associated dataset
        raw_data = await dataset_service.get_dataset_data(db, db_chart.dataset_id, owner_id, limit=500) # Max 500 rows for chart preview
        
        if not raw_data:
            return {"labels": [], "datasets": []}

        df = pd.DataFrame(raw_data)

        # --- Basic data transformation based on chart type and config ---
        # This is a very simplified example. Real charting libraries require specific formats.
        # Chart.js requires {labels: [...], datasets: [{label: ..., data: [...]}]}

        chart_data = {"labels": [], "datasets": []}
        
        x_axis_field = db_chart.config.get("x_axis")
        y_axis_field = db_chart.config.get("y_axis")
        
        if not x_axis_field or not y_axis_field:
            # Fallback for simple charts if config is missing
            if len(df.columns) >= 2:
                x_axis_field = df.columns[0]
                y_axis_field = df.columns[1]
            else:
                raise HTTPException(status_code=400, detail="Chart config missing x_axis or y_axis field, and dataset too small for inference.")


        if x_axis_field in df.columns and y_axis_field in df.columns:
            chart_data["labels"] = df[x_axis_field].tolist()
            chart_data["datasets"] = [
                {
                    "label": y_axis_field,
                    "data": df[y_axis_field].tolist(),
                    "backgroundColor": "rgba(75, 192, 192, 0.6)",
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "borderWidth": 1,
                }
            ]
        else:
            raise HTTPException(status_code=400, detail=f"Invalid x_axis ({x_axis_field}) or y_axis ({y_axis_field}) field in chart configuration for the given dataset.")
        # --- End data transformation ---

        return chart_data

chart_service = ChartService()
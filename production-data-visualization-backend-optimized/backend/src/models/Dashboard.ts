```typescript
import { Visualization, VisualizationConfig, ChartType } from './Visualization';

export interface VisualizationPosition {
  x: number;
  y: number;
  w: number; // width
  h: number; // height
  [key: string]: any; // for other layout properties
}

// Interface for a visualization as it appears within a dashboard
export interface DashboardVisualization extends Pick<Visualization, 'id' | 'name' | 'chart_type' | 'data_source_id' | 'config'> {
  position: VisualizationPosition | string; // Stored as JSON string in DB, parsed to object in app
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visualizations?: DashboardVisualization[]; // Populated when fetching by ID
  created_at: string;
  updated_at: string;
}
```
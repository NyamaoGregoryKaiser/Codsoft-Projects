```typescript
export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Scatter = 'scatter',
}

export interface VisualizationConfig {
  x_axis?: string; // Column name for x-axis
  y_axis?: string; // Column name for y-axis
  label_column?: string; // Column name for labels (e.g., categories for bar/line, slices for pie)
  data_column?: string; // Column name for data values (e.g., quantities for bar/line, values for pie)
  title?: string;
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  // Add more Chart.js specific options as needed
  [key: string]: any;
}

export interface Visualization {
  id: string;
  user_id: string;
  data_source_id: string;
  name: string;
  chart_type: ChartType;
  config: VisualizationConfig | string; // Stored as JSON string in DB, parsed to object in app
  created_at: string;
  updated_at: string;
}
```
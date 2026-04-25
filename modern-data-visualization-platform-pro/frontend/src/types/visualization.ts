import { Dataset } from './dataset';
import { Dashboard } from './dashboard';

/**
 * Enum for supported chart types.
 */
export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Table = 'table',
}

/**
 * Represents a visualization object.
 */
export interface Visualization {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  type: ChartType;
  config: Record<string, any>; // JSON configuration specific to the chart type
  datasetId: string;
  dataset?: Dataset; // Optional, might be eager loaded for data processing
  dashboardId?: string | null;
  dashboard?: Dashboard; // Optional, might be eager loaded for context/ownership
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents processed data ready for charting.
 * The structure depends on the chart library and type (e.g., Chart.js data object).
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
    hoverBackgroundColor?: string[];
    // Add other common chart.js dataset properties
  }>;
}

/**
 * Represents processed data for a table visualization.
 */
export interface TableData {
  columns: Array<{ field: string; headerName: string; width: number }>;
  rows: Record<string, any>[];
}

/**
 * Generic type for processed visualization data, can be ChartData or TableData.
 */
export type ProcessedVisualizationData = ChartData | TableData;
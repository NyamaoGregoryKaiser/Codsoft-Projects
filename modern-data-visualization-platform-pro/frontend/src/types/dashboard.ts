import { Visualization } from './visualization';

/**
 * Represents a dashboard object, potentially with its associated visualizations.
 */
export interface Dashboard {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  visualizations?: Visualization[]; // Optional, might be eager loaded or fetched separately
}

/**
 * Represents a simplified dashboard for display in lists.
 */
export type DashboardListItem = Omit<Dashboard, 'visualizations'>;
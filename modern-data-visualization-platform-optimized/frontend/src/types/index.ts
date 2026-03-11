export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  token: string;
}

export interface DataSource {
  id: number;
  name: string;
  type: string; // e.g., POSTGRES, REST_API
  connectionDetails: string; // JSON string
  ownerId: number;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visualization {
  id?: number; // Optional for creation
  title: string;
  description?: string;
  type: string; // e.g., BAR_CHART, LINE_CHART, PIE_CHART, TABLE
  dataSourceId: number;
  dataSourceName?: string; // For display
  query: string; // SQL query or API path
  config: string; // JSON string for chart options
  position: number;
  sizeX: number;
  sizeY: number;
  dashboardId: number;
  ownerId: number;
  ownerUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Dashboard {
  id?: number; // Optional for creation
  title: string;
  description?: string;
  ownerId: number;
  ownerUsername?: string;
  visualizations: Visualization[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DataQueryResponse {
  data: Record<string, any>[];
  message: string;
  success: boolean;
}

// For react-grid-layout
export interface LayoutItem {
  i: string; // Visualization ID
  x: number;
  y: number;
  w: number;
  h: number;
}
```

#### API Services (`api` folder)

```typescript
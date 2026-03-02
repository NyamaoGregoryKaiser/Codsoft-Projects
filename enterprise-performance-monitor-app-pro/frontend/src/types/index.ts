export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  apiKey: string; // Only returned on creation/refresh, or when fetched by owner
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  applicationId: string;
  name: string;
  pathRegex?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceMetric {
  id: string;
  applicationId: string;
  pageId?: string;
  metricType: string;
  value: number;
  userSessionId?: string;
  browser?: string;
  os?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  country?: string;
  url?: string;
  timestamp: string;
}

export interface MetricTrendData {
  date: string;
  averageValue: number;
}

export interface BreakdownData {
  browser?: string;
  deviceType?: string;
  averageValue: number;
}
```

**`frontend/src/api/axiosConfig.ts`**
```typescript
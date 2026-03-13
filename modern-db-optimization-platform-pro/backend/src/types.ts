```typescript
import { Request } from 'express';
import { UserRole } from './shared/enums';

// Extend Express Request to include user information after authentication
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      username: string;
      role: UserRole;
    };
  }
}

// Common pagination and sorting types
export type PaginationOptions = {
  page?: number;
  limit?: number;
};

export type SortOptions = {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export type DbConnectionInfo = {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string; // Optional, as it might be excluded for security reasons
};

export type QueryMetrics = {
  pid: number;
  application_name: string;
  datname: string;
  usename: string;
  client_addr: string;
  client_port: number;
  backend_start: Date;
  xact_start: Date;
  query_start: Date;
  state_change: Date;
  state: string;
  wait_event_type: string | null;
  wait_event: string | null;
  query: string;
  backend_type: string;
  duration_ms?: number; // Calculated duration for active queries
};

export type IndexMetrics = {
  schemaname: string;
  relname: string; // Table name
  indexrelname: string; // Index name
  idx_scan: string;
  idx_tup_read: string;
  idx_tup_fetch: string;
  indexdef: string; // The CREATE INDEX statement
};

export type TableSchema = {
  tableName: string;
  columns: {
    columnName: string;
    dataType: string;
    isNullable: boolean;
    defaultValue: string | null;
    isPrimary: boolean;
  }[];
};
```
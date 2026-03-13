```typescript
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DbConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  dbName: string;
  dbUser: string;
  // dbPassword is intentionally omitted for security reasons in the frontend type
}

export interface QueryMetrics {
  pid: number;
  application_name: string;
  datname: string;
  usename: string;
  client_addr: string;
  client_port: number;
  backend_start: string;
  xact_start: string;
  query_start: string;
  state_change: string;
  state: string;
  wait_event_type: string | null;
  wait_event: string | null;
  query: string;
  backend_type: string;
  duration_ms?: number;
}

export interface IndexMetrics {
  schemaname: string;
  relname: string; // Table name
  indexrelname: string; // Index name
  idx_scan: string;
  idx_tup_read: string;
  idx_tup_fetch: string;
  indexdef: string; // The CREATE INDEX statement
}

export interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimary: boolean;
}

export interface TableSchema {
  tableName: string;
  columns: TableColumn[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}
```
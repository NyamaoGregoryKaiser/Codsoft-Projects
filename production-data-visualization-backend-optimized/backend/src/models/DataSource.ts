```typescript
export interface DataSource {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: 'csv';
  column_headers: string[] | string; // Stored as JSON string in DB, parsed to array in app
  created_at: string;
  updated_at: string;
}
```
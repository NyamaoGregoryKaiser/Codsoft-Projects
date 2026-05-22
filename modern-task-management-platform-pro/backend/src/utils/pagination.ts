```typescript
import { Request } from 'express';

interface PaginationOptions {
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPaginationOptions(req: Request): PaginationOptions {
  const limit = parseInt(req.query.limit as string || '10', 10);
  const page = parseInt(req.query.page as string || '1', 10);
  const orderBy = req.query.orderBy as string || 'createdAt';
  const orderDirection = (req.query.orderDirection as string || 'DESC').toUpperCase() as 'ASC' | 'DESC';

  return {
    limit: Math.max(1, limit), // Ensure limit is at least 1
    page: Math.max(1, page),   // Ensure page is at least 1
    orderBy,
    orderDirection,
  };
}
```
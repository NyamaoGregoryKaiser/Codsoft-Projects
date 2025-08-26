```typescript
import express, { Request, Response } from 'express';
import { Pool } from 'pg';
// ... other imports

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({
  // ... database connection details from environment variables
});

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ... other API routes

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```
```typescript
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_FILE = process.env.DB_FILE || 'database.sqlite';

export const dbConfig = {
  databasePath: path.resolve(DATA_DIR, DB_FILE),
  migrationsDir: path.resolve(__dirname, '../database/migrations'),
  seedFile: path.resolve(__dirname, '../database/seed.sql'),
  dataStorageDir: path.resolve(DATA_DIR) // Directory for uploaded CSVs
};
```
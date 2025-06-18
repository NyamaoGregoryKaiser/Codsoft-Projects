```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
});


export const connectDb = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Connected to PostgreSQL');
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
};

export default pool; //Export the pool for queries in other modules

```
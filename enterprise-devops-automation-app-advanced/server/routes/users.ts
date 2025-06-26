```typescript
import express from 'express';
import { Pool } from 'pg'; // Assuming PostgreSQL
import { Request, Response } from 'express';

const router = express.Router();

// ... (Database connection setup)

//Example Route -  needs error handling and more robust security.
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        //Hash password before storing
        //....
        const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, password]); //needs to be improved
        res.json(newUser.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

export default router;

```
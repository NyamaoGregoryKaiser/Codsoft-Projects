```typescript
import express, { Request, Response, NextFunction } from 'express';
import { Sequelize } from 'sequelize';
import { User } from './models/User'; // Your User model
import routes from './routes';
import { authenticateJWT } from './middleware/auth'; // JWT authentication middleware
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const sequelize = new Sequelize(process.env.DATABASE_URL!); // PostgreSQL connection

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await sequelize.sync(); // Sync models with DB (Careful in production!)
        // Add your seed data call here if needed (only during development!)
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

app.use('/api', routes);


// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

```
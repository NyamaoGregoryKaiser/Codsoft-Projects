```typescript
import express, { Request, Response } from 'express';
import { connectDb } from './db/connect';
import userRouter from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler'; // Example error handler


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false })); // For urlencoded body parsing

// Database Connection
connectDb();

// Routes
app.use('/api/users', userRouter);


// Error Handling Middleware
app.use(errorHandler);


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

```
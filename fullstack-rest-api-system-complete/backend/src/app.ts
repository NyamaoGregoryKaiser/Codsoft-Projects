import 'reflect-metadata'; // Must be imported once at the top of the entry file
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import logger from './utils/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';

class App {
  public app: express.Application;
  public port: number;

  constructor() {
    this.app = express();
    this.port = config.port;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(cors({ origin: '*', credentials: true })); // Adjust CORS as needed for production
    this.app.use(helmet()); // Secure Express apps by setting various HTTP headers
    this.app.use(express.json()); // Body parser for JSON
    this.app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

    // Apply rate limiting to all requests (except specific auth routes if they have their own)
    this.app.use(rateLimitMiddleware);

    // Logging middleware (optional, winston already logs errors)
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.originalUrl}`);
      next();
    });
  }

  private initializeRoutes() {
    this.app.get('/', (req, res) => {
      res.send('Welcome to Horizon PMS API!');
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/tasks', taskRoutes);
    this.app.use('/api/comments', commentRoutes);

    // Catch-all for undefined routes
    this.app.use((req, res, next) => {
      const error = new Error(`Not Found - ${req.originalUrl}`);
      res.status(404);
      next(error);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  }
}

export default App;
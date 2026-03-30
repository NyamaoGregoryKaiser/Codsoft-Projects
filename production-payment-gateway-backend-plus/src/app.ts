```typescript
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import config from "./config";
import apiRoutes from "./routes";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";
import { setupRateLimit } from "./middlewares/rateLimit.middleware";
import logger from "./config/logger";

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate Limiting
app.use(setupRateLimit());

// API Routes
app.use("/api/v1", apiRoutes);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// 404 Not Found Middleware
app.use(notFoundHandler);

// Global Error Handling Middleware
app.use(errorHandler);

// Logging HTTP requests (optional, can be added with morgan or custom middleware)
// For simplicity, we're relying on Winston for application logging.
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`);
  next();
});

export default app;
```
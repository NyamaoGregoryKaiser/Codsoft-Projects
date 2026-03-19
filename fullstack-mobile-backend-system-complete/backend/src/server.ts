import app from './app';
import { PORT } from './config/config';
import logger from './utils/logger';

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
};

startServer();
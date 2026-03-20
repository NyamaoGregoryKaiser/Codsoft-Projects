const logger = require('@utils/logger');

/**
 * Express middleware for request logging.
 * Logs incoming requests and their completion status.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Log request details
  logger.http(`--> ${method} ${originalUrl} from ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.http(`<-- ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = loggingMiddleware;
const logger = require('../utils/logger');

const loggerMiddleware = (req, res, next) => {
  // Exclude health checks from verbose logging
  if (req.originalUrl === '/') return next();

  logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer,
    },
  });

  // Log response status and duration
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const ms = (duration[0] * 1e9 + duration[1]) / 1e6;
    logger.info(`Outgoing Response: ${req.method} ${req.originalUrl} - ${res.statusCode} ${res.statusMessage} - ${ms.toFixed(2)}ms`, {
      statusCode: res.statusCode,
      duration_ms: ms.toFixed(2),
    });
  });

  next();
};

module.exports = loggerMiddleware;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 30,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 30,
  },
  db: {
    database: process.env.DB_NAME || 'scraping_db',
    username: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    url: process.env.DATABASE_URL, // For Heroku/Render
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS === 'true',
    args: process.env.PUPPETEER_ARGS ? process.env.PUPPETEER_ARGS.split(',') : [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#error-puppeteerlaunch-failed-to-launch-the-browser-process
      '--disable-gpu'
    ]
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  cache: {
    ttlSeconds: 60 * 5, // 5 minutes
  }
};
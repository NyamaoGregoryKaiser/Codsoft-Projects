require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'cms_user',
    password: process.env.DB_PASSWORD || 'cms_password',
    database: process.env.DB_DATABASE || 'cms_dev_db',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: (msg) => {
      // Only log SQL queries in development
      if (process.env.NODE_ENV === 'development') {
        require('../utils/logger').debug(msg);
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: process.env.TEST_DB_USERNAME || 'cms_user',
    password: process.env.TEST_DB_PASSWORD || 'cms_password',
    database: process.env.TEST_DB_DATABASE || 'cms_test_db',
    host: process.env.TEST_DB_HOST || 'localhost',
    dialect: 'postgres',
    port: process.env.TEST_DB_PORT || 5432,
    logging: false, // No logging during tests
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false, // Disable verbose SQL logging in production
    dialectOptions: {
      ssl: {
        require: true, // Ensure SSL is used in production
        rejectUnauthorized: false // Adjust based on your SSL certificate setup
      }
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 15000,
    },
  },
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkeyforCMS!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10), // Cache Time-To-Live in seconds (5 minutes)
};
```
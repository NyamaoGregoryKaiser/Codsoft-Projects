```javascript
const knex = require('knex');
const knexConfig = require('./knexfile');
const config = require('../config');
const { logger } = require('../middleware/logger');

const environment = config.env; // 'development', 'test', or 'production'
const db = knex(knexConfig[environment]);

const connectDb = async () => {
  try {
    await db.raw('SELECT 1'); // Simple query to test connection
    logger.info(`Successfully connected to the database in ${environment} environment.`);

    // Run migrations on connect
    if (environment !== 'test') { // Migrations are typically handled externally for production, but for dev/test convenience.
      await db.migrate.latest();
      logger.info('Database migrations ran successfully.');
    }

  } catch (error) {
    logger.error('Failed to connect to the database or run migrations:', error);
    process.exit(1); // Exit process if DB connection fails
  }
};

module.exports = { db, connectDb };
```

#### Migrations
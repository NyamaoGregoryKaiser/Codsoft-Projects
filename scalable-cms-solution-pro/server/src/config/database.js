```javascript
const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

// Parse DATABASE_URL for different environments
const parseDatabaseUrl = (url) => {
  const urlParts = new URL(url);
  return {
    dialect: urlParts.protocol.replace(':', ''),
    host: urlParts.hostname,
    port: urlParts.port,
    username: urlParts.username,
    password: urlParts.password,
    database: urlParts.pathname.substring(1),
  };
};

const commonOptions = {
  logging: (msg) => logger.debug(msg), // Log all SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    freezeTableName: true, // Prevent sequelize from auto-pluralizing table names
  },
  dialectOptions: {
    // For production, especially with cloud providers like Heroku/Railway, SSL might be required
    // ssl: {
    //   require: true,
    //   rejectUnauthorized: false, // For self-signed certificates or specific cloud setups
    // },
  },
};

const developmentDbConfig = parseDatabaseUrl(config.DATABASE_URL);
const testDbConfig = { ...developmentDbConfig, database: `${developmentDbConfig.database}_test` }; // For isolated tests
const productionDbConfig = parseDatabaseUrl(config.DATABASE_URL);


const databaseConfigurations = {
  development: {
    ...developmentDbConfig,
    ...commonOptions,
  },
  test: {
    ...testDbConfig,
    ...commonOptions,
    // Disable logging for test environment to keep test output clean
    logging: false,
  },
  production: {
    ...productionDbConfig,
    ...commonOptions,
    // Production specific options
    dialectOptions: {
      ssl: {
        require: true, // enforce SSL
        rejectUnauthorized: false, // This may be necessary depending on your PostgreSQL provider
      },
    },
  },
};

// Export raw configurations for migrations
module.exports = databaseConfigurations;


// Initialize Sequelize instance for application use
const sequelize = new Sequelize(config.DATABASE_URL, {
  ...databaseConfigurations[config.NODE_ENV],
  // Overwrite logging for app if different than migration
  logging: (msg) => logger.debug(msg),
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully.');
    // In development/test, auto-sync models, in production, rely on migrations
    if (config.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true }); // Use { alter: true } in dev to apply incremental changes
      logger.info('Database models synchronized.');
    }
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports.connectDB = connectDB;
module.exports.sequelize = sequelize; // Export sequelize instance for direct use (e.g., in models)
```
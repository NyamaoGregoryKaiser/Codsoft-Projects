```javascript
const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.env === 'development' ? (msg) => logger.debug(`[DB]: ${msg}`) : false,
  dialectOptions: config.db.ssl ? {
    ssl: {
      require: true,
      rejectUnauthorized: false, // For development/self-signed, set to true for proper CAs
    },
  } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Import models
const User = require('./models/user')(sequelize, Sequelize.DataTypes);
const Role = require('./models/role')(sequelize, Sequelize.DataTypes);
const Permission = require('./models/permission')(sequelize, Sequelize.DataTypes);
const ContentType = require('./models/contentType')(sequelize, Sequelize.DataTypes);
const ContentItem = require('./models/contentItem')(sequelize, Sequelize.DataTypes);
const Media = require('./models/media')(sequelize, Sequelize.DataTypes);

// Define associations
User.associate(sequelize.models);
Role.associate(sequelize.models);
Permission.associate(sequelize.models);
ContentType.associate(sequelize.models);
ContentItem.associate(sequelize.models);
Media.associate(sequelize.models);

/**
 * Connects to the database and synchronizes models.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    // In production, migrations should be run explicitly, not with sync()
    // For development, `sequelize.sync({ alter: true })` can be useful
    // await sequelize.sync({ alter: true }); // Use { alter: true } for minor changes, { force: true } for full reset
    // logger.info('Database models synchronized.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
  models: sequelize.models,
};
```
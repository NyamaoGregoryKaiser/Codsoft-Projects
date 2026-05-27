```javascript
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
const databaseConfig = require('../config/database');
const logger = require('../utils/logger');

const env = config.NODE_ENV || 'development';
const dbConfig = databaseConfig[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: (msg) => logger.debug(msg), // Log SQL queries at debug level
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // Optionally, for better timezone handling if not using UTC everywhere
  // timezone: '+00:00', // for postgres
});

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import models
db.User = require('./user.model')(sequelize, DataTypes);
db.Post = require('./post.model')(sequelize, DataTypes);
db.Category = require('./category.model')(sequelize, DataTypes);
db.Media = require('./media.model')(sequelize, DataTypes);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
```
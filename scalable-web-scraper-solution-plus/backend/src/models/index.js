```javascript
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = require('../config/database')[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? (msg) => logger.debug(msg) : false,
    dialectOptions: dbConfig.dialectOptions || {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, DataTypes);
db.ScrapingJob = require('./ScrapingJob')(sequelize, DataTypes);
db.ScrapingResult = require('./ScrapingResult')(sequelize, DataTypes);

// Define associations
db.User.hasMany(db.ScrapingJob, {
  foreignKey: 'userId',
  as: 'jobs',
  onDelete: 'CASCADE',
});
db.ScrapingJob.belongsTo(db.User, {
  foreignKey: 'userId',
  as: 'user',
});

db.ScrapingJob.hasMany(db.ScrapingResult, {
  foreignKey: 'jobId',
  as: 'results',
  onDelete: 'CASCADE',
});
db.ScrapingResult.belongsTo(db.ScrapingJob, {
  foreignKey: 'jobId',
  as: 'job',
});

module.exports = db;
```
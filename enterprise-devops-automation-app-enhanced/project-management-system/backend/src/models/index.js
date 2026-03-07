```javascript
const Sequelize = require('sequelize');
const config = require('../config');
const logger = require('../config/logger');

const sequelize = new Sequelize(config.db.url, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  define: {
    freezeTableName: true, // Prevents Sequelize from pluralizing table names
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const models = {
  User: require('./user')(sequelize, Sequelize.DataTypes),
  Project: require('./project')(sequelize, Sequelize.DataTypes),
  Task: require('./task')(sequelize, Sequelize.DataTypes),
  Comment: require('./comment')(sequelize, Sequelize.DataTypes),
};

// Apply associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};
```
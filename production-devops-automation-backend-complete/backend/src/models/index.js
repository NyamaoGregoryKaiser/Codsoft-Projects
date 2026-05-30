```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const logger = require('../config/logger.config');

const db = {};

db.sequelize = sequelize;
db.Sequelize = DataTypes; // Expose DataTypes for consistency

// Import models
db.User = require('./user.model')(sequelize, DataTypes);
db.Project = require('./project.model')(sequelize, DataTypes);
db.Task = require('./task.model')(sequelize, DataTypes);

// Define Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
```
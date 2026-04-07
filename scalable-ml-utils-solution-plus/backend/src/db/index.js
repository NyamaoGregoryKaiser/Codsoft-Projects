```javascript
const { Sequelize } = require('sequelize');
const config = require('../config/config');
const logger = require('../utils/logger');

const dbConfig = config.db;

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // ssl: {
    //   require: true, // This will require SSL connections
    //   rejectUnauthorized: false // This will bypass SSL certificate verification
    // }
  }
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Load models
db.User = require('./models/user')(sequelize, Sequelize);
db.Model = require('./models/model')(sequelize, Sequelize);
db.Dataset = require('./models/dataset')(sequelize, Sequelize);
db.InferenceLog = require('./models/inferenceLog')(sequelize, Sequelize);

// Establish associations
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
```
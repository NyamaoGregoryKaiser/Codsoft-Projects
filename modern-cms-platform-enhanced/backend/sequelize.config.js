```javascript
const config = require('./src/config/config');

module.exports = {
  development: {
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false, // Set to true to see SQL queries in development logs
  },
  test: {
    username: config.db.username,
    password: config.db.password,
    database: `${config.db.database}_test`, // Separate test database
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false, // Keep test logs clean
  },
  production: {
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: false, // No logging in production
    dialectOptions: {
      // ssl: {
      //   require: true, // For Heroku or similar cloud DBs
      //   rejectUnauthorized: false // For self-signed certificates
      // }
    }
  }
};
```
```javascript
const config = require('./index');

module.exports = {
  development: {
    username: config.database.user,
    password: config.database.pass,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
  },
  test: {
    username: config.database.user,
    password: config.database.pass,
    database: `${config.database.name}_test`, // Use a separate test database
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: false, // Disable logging for tests
  },
  production: {
    username: config.database.user,
    password: config.database.pass,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // This is often needed for various cloud providers
      },
    },
    logging: false,
  },
};
```
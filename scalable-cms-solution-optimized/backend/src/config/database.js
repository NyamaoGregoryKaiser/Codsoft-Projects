// This file is specifically for Sequelize CLI commands (migrations, seeders).
// It loads the configuration based on NODE_ENV.
const config = require('./config');

module.exports = {
  development: config.development,
  test: config.test,
  production: config.production,
};
```
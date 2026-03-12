```javascript
require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgres://perfmon_user:perfmon_password@localhost:5432/perfmon_db',
    dialect: 'postgres',
    logging: false, // Set to console.log for SQL query logging
    dialectOptions: {
      ssl: process.env.DB_SSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  test: {
    url: process.env.DATABASE_URL_TEST || 'postgres://perfmon_user:perfmon_password@localhost:5433/perfmon_test_db',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
```
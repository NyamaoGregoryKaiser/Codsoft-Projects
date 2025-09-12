```javascript
module.exports = {
  development: {
    client: 'pg',
    connection: {
      database: 'ml_house_prices_dev',
      user: 'your_db_user',
      password: 'your_db_password'
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  // ...other environments (test, production)
};
```
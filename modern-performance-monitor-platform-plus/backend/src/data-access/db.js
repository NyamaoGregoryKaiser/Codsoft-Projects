```javascript
const knex = require('knex');
const knexConfig = require('./knexfile');
const config = require('../config');

// Determine environment
const environment = config.env; // 'development', 'test', or 'production'

const db = knex(knexConfig[environment]);

module.exports = db;
```
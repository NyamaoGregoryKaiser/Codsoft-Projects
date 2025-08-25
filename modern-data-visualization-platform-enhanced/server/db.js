```javascript
const { Pool } = require('pg');
const { db_config } = require('../config'); //Import configuration from .env or config file

const pool = new Pool(db_config);

module.exports = {
  query: (text, params) => pool.query(text, params),
};
```
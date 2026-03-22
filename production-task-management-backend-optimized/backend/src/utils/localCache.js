```javascript
const NodeCache = require('node-cache');
const config = require('../config');

// Default cache TTL to 5 minutes (300 seconds)
const localCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

module.exports = localCache;
```
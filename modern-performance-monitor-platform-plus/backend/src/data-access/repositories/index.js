```javascript
// Central export for all repositories
const userRepository = require('./userRepository');
const projectRepository = require('./projectRepository');
const metricRepository = require('./metricRepository');
const alertRepository = require('./alertRepository');

module.exports = {
  userRepository,
  projectRepository,
  metricRepository,
  alertRepository,
};
```
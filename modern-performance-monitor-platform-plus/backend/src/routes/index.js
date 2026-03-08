```javascript
const express = require('express');
const authRoute = require('./auth.route');
const projectRoute = require('./project.route');
const metricRoute = require('./metric.route');
const alertRoute = require('./alert.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/projects',
    route: projectRoute,
  },
  {
    path: '/metrics',
    route: metricRoute,
  },
  {
    path: '/projects', // Alerts are nested under projects
    route: alertRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
```
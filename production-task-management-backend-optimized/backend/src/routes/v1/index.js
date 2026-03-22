```javascript
const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const projectRoute = require('./project.route');
const taskRoute = require('./task.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/projects',
    route: projectRoute,
  },
  {
    path: '/tasks',
    route: taskRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
```
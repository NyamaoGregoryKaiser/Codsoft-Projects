```javascript
const express = require('express');
const authRoute = require('./authRoutes');
const userRoute = require('./userRoutes');
const projectRoute = require('./projectRoutes');
const taskRoute = require('./taskRoutes');
const commentRoute = require('./commentRoutes');

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
  {
    path: '/comments',
    route: commentRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
```
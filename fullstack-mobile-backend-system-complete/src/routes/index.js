```javascript
const express = require('express');
const authRoute = require('../modules/auth/auth.route');
const userRoute = require('../modules/users/user.route');
const projectRoute = require('../modules/projects/project.route');

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
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
```
```javascript
const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const chatRoute = require('./chat.route');

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
    path: '/chat',
    route: chatRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
```
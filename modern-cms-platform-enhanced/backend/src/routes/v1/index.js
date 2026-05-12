```javascript
const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const contentTypeRoute = require('./contentType.route');
const entryRoute = require('./entry.route');
const mediaRoute = require('./media.route');
const { apiLimiter } = require('../../middleware/rateLimiter');

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
    path: '/content-types',
    route: contentTypeRoute,
  },
  {
    path: '/content-types', // Prefix for entries on content types
    route: entryRoute,
  },
  {
    path: '/media',
    route: mediaRoute,
  },
];

// Apply general API rate limiting to all default routes
defaultRoutes.forEach((route) => {
  router.use(route.path, apiLimiter, route.route);
});

module.exports = router;
```
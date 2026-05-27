```javascript
const express = require('express');
const router = express.Router();

// Import all specific route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');
const mediaRoutes = require('./media.routes');

// Define API endpoint prefixes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/categories', categoryRoutes);
router.use('/media', mediaRoutes);

// Add Swagger Docs if needed (only in development)
const config = require('../config/config');
if (config.NODE_ENV === 'development') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('../config/swagger');
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = router;
```
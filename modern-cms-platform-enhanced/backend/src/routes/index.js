```javascript
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');
const tagRoutes = require('./tag.routes');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Apply caching for public-facing post routes (e.g., getting published posts)
// Specific cache times can be adjusted per route
router.use('/posts', postRoutes); // Specific caching handled inside post.routes.js for public routes

router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);

module.exports = router;
```
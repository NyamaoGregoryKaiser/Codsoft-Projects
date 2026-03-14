```javascript
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const contentTypeRoutes = require('./contentType.routes');
const contentItemRoutes = require('./contentItem.routes');
const mediaRoutes = require('./media.routes');

const router = express.Router();

// Define API routes for different modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/content-types', contentTypeRoutes);
router.use('/content-items', contentItemRoutes);
router.use('/media', mediaRoutes);

// Health check endpoint
router.get('/health', (req, res) => res.status(200).send('API is healthy!'));

module.exports = router;
```
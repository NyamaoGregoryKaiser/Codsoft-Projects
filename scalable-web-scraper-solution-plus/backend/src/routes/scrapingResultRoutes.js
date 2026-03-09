```javascript
const express = require('express');
const router = express.Router();
const {
  getResults,
  getResultById
} = require('../controllers/scrapingResultController');

// All routes here are protected by the `protect` middleware set in app.js

router.route('/')
  .get(getResults);

router.route('/:id')
  .get(getResultById);

module.exports = router;
```
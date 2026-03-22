```javascript
const express = require('express');
const { auth, isOwnerOrAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const projectValidation = require('../../validations/project.validation');
const projectController = require('../../controllers/project.controller');
const { invalidateCache, cacheMiddleware } = require('../../middlewares/cache');

const router = express.Router();

router
  .route('/')
  .post(auth('USER', 'ADMIN'), invalidateCache('projects'), validate(projectValidation.createProject), projectController.createProject)
  .get(auth('USER', 'ADMIN'), cacheMiddleware('projects', 60), projectController.getProjects); // Cache projects list for 1 minute

router
  .route('/:projectId')
  .get(auth('USER', 'ADMIN'), validate(projectValidation.getProject), projectController.getProject)
  .patch(auth('USER', 'ADMIN'), isOwnerOrAdmin('project', 'projectId'), invalidateCache('projects'), validate(projectValidation.updateProject), projectController.updateProject)
  .delete(auth('USER', 'ADMIN'), isOwnerOrAdmin('project', 'projectId'), invalidateCache('projects'), validate(projectValidation.deleteProject), projectController.deleteProject);

module.exports = router;
```
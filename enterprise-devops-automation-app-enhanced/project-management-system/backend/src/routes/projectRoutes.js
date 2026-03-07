```javascript
const express = require('express');
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(auth(), projectController.createProject)
  .get(auth(), projectController.getProjects);

router
  .route('/:projectId')
  .get(auth(), projectController.getProject)
  .patch(auth(), projectController.updateProject)
  .delete(auth(), projectController.deleteProject);

router.post('/:projectId/members', auth(), projectController.addProjectMember);
router.delete('/:projectId/members', auth(), projectController.removeProjectMember);

module.exports = router;
```
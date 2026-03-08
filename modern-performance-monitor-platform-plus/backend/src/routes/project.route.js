```javascript
const express = require('express');
const projectController = require('../controllers/projectController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

const projectIdParamSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
};

const createProjectSchema = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
  }),
};

const updateProjectSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
  }).min(1),
};


router
  .route('/')
  .post(auth(), validate(createProjectSchema), projectController.createProject)
  .get(auth(), projectController.getProjects);

router
  .route('/:projectId')
  .get(auth(), validate(projectIdParamSchema), projectController.getProject)
  .patch(auth(), validate(updateProjectSchema), projectController.updateProject)
  .delete(auth(), validate(projectIdParamSchema), projectController.deleteProject);

router.post('/:projectId/generate-api-key', auth(), validate(projectIdParamSchema), projectController.generateNewApiKey);

module.exports = router;
```
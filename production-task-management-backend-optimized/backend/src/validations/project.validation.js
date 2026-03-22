```javascript
const Joi = require('joi');

const createProject = Joi.object().keys({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(0).max(500).allow(''),
  memberIds: Joi.array().items(Joi.string().guid({ version: ['uuidv4'] })).optional(),
});

const getProject = Joi.object().keys({
  projectId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

const updateProject = Joi.object().keys({
  name: Joi.string().min(3).max(100),
  description: Joi.string().min(0).max(500).allow(''),
  memberIds: Joi.array().items(Joi.string().guid({ version: ['uuidv4'] })).optional(),
});

const deleteProject = Joi.object().keys({
  projectId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

module.exports = {
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
```
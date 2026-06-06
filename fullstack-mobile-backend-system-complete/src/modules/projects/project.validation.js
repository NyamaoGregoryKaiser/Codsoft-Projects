```javascript
const Joi = require('joi');
const { uuid } = require('../users/user.validation'); // Re-use uuid validation from user

const createProject = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
});

const getProjects = Joi.object().keys({
  name: Joi.string(),
  ownerId: Joi.custom(uuid),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  sortBy: Joi.string(), // e.g., 'createdAt:desc,name:asc'
});

const getProject = Joi.object().keys({
  projectId: Joi.custom(uuid).required(),
});

const updateProject = Joi.object().keys({
  name: Joi.string(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'),
})
  .min(1); // At least one field is required for update

const deleteProject = Joi.object().keys({
  projectId: Joi.custom(uuid).required(),
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};
```
```javascript
const Joi = require('joi');
const { uuid } = require('../users/user.validation'); // Re-use uuid validation from user

const createTask = Joi.object().keys({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  assignedToId: Joi.custom(uuid).allow(null),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE').required(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').required(),
  dueDate: Joi.date().iso().allow(null),
});

const getTasks = Joi.object().keys({
  projectId: Joi.custom(uuid).required(),
  title: Joi.string(),
  assignedToId: Joi.custom(uuid),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE'),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  sortBy: Joi.string(),
});

const getTask = Joi.object().keys({
  projectId: Joi.custom(uuid).required(),
  taskId: Joi.custom(uuid).required(),
});

const updateTask = Joi.object().keys({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  assignedToId: Joi.custom(uuid).allow(null),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'DONE'),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH'),
  dueDate: Joi.date().iso().allow(null),
})
  .min(1);

const deleteTask = Joi.object().keys({
  projectId: Joi.custom(uuid).required(),
  taskId: Joi.custom(uuid).required(),
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
};
```
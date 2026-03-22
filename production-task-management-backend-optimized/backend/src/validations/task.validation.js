```javascript
const Joi = require('joi');
const { TaskStatus, TaskPriority } = require('@prisma/client');

const createTask = Joi.object().keys({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(0).max(1000).allow(''),
  projectId: Joi.string().guid({ version: ['uuidv4'] }).required(),
  assigneeId: Joi.string().guid({ version: ['uuidv4'] }).allow(null),
  status: Joi.string().valid(...Object.values(TaskStatus)).default(TaskStatus.TODO),
  priority: Joi.string().valid(...Object.values(TaskPriority)).default(TaskPriority.MEDIUM),
  dueDate: Joi.date().iso().allow(null),
});

const getTask = Joi.object().keys({
  taskId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

const updateTask = Joi.object().keys({
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(0).max(1000).allow(''),
  assigneeId: Joi.string().guid({ version: ['uuidv4'] }).allow(null),
  status: Joi.string().valid(...Object.values(TaskStatus)),
  priority: Joi.string().valid(...Object.values(TaskPriority)),
  dueDate: Joi.date().iso().allow(null),
});

const deleteTask = Joi.object().keys({
  taskId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
};
```
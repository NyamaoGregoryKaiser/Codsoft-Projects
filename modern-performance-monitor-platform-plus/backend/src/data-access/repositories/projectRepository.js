```javascript
const db = require('../db');

const TABLE_NAME = 'projects';

const findById = async (id) => {
  return db(TABLE_NAME).where({ id }).first();
};

const findByUserId = async (userId) => {
  return db(TABLE_NAME).where({ user_id: userId });
};

const findByApiKey = async (apiKey) => {
  return db(TABLE_NAME).where({ api_key: apiKey }).first();
};

const create = async (project) => {
  const [createdProject] = await db(TABLE_NAME).insert(project).returning('*');
  return createdProject;
};

const update = async (id, updates) => {
  const [updatedProject] = await db(TABLE_NAME).where({ id }).update(updates).returning('*');
  return updatedProject;
};

const remove = async (id) => {
  await db(TABLE_NAME).where({ id }).del();
  return true;
};

module.exports = {
  findById,
  findByUserId,
  findByApiKey,
  create,
  update,
  remove,
};
```
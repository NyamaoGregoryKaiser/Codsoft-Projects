```javascript
const db = require('../db');

const TABLE_NAME = 'users';

const findByEmail = async (email) => {
  return db(TABLE_NAME).where({ email }).first();
};

const findById = async (id) => {
  return db(TABLE_NAME).where({ id }).first();
};

const create = async (user) => {
  const [createdUser] = await db(TABLE_NAME).insert(user).returning('*');
  return createdUser;
};

const update = async (id, updates) => {
  const [updatedUser] = await db(TABLE_NAME).where({ id }).update(updates).returning('*');
  return updatedUser;
};

const remove = async (id) => {
  await db(TABLE_NAME).where({ id }).del();
  return true;
};

module.exports = {
  findByEmail,
  findById,
  create,
  update,
  remove,
};
```
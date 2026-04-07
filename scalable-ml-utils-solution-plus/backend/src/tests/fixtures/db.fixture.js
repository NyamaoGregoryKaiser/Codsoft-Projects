```javascript
const bcrypt = require('bcryptjs');
const db = require('../../db');
const config = require('../../config/config');

const setupTestDB = async () => {
  if (db.sequelize.options.database !== config.db.database) {
    throw new Error(`Attempting to run tests on production DB: ${db.sequelize.options.database}. Test DB should be ${config.db.database}`);
  }

  await db.sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'); // Clear all tables
  await db.sequelize.sync({ force: true }); // Sync models to create tables
  await db.sequelize.query('CREATE TYPE "enum_models_type" AS ENUM (\'classification\', \'regression\', \'clustering\', \'other\');');
  await db.sequelize.query('CREATE TYPE "enum_inference_logs_status" AS ENUM (\'success\', \'error\');');
  await db.sequelize.query('CREATE TYPE "enum_users_role" AS ENUM (\'user\', \'admin\');');

  // Re-sync after creating enums manually
  await db.sequelize.sync({ force: true });
};

const insertUsers = async (users) => {
  const usersWithHashedPassword = await Promise.all(users.map(async (user) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return { ...user, password: hashedPassword };
  }));
  return db.User.bulkCreate(usersWithHashedPassword, { returning: true });
};

const adminUser = {
  id: '01010101-0101-0101-0101-010101010101',
  username: 'adminuser',
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin',
};

const regularUser = {
  id: '02020202-0202-0202-0202-020202020202',
  username: 'regularuser',
  email: 'user@test.com',
  password: 'password123',
  role: 'user',
};

const userOne = {
  id: 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
  username: 'userone',
  email: 'userone@test.com',
  password: 'password123',
  role: 'user',
};

const userTwo = {
  id: 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
  username: 'usertwo',
  email: 'usertwo@test.com',
  password: 'password123',
  role: 'user',
};

module.exports = {
  setupTestDB,
  insertUsers,
  adminUser,
  regularUser,
  userOne,
  userTwo
};
```
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../../src/db/models');

const adminUser = {
  id: uuidv4(),
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'adminpassword',
  role: 'admin',
};

const userOne = {
  id: uuidv4(),
  name: 'Test User One',
  email: 'user1@example.com',
  password: 'password1',
  role: 'user',
};

const userTwo = {
  id: uuidv4(),
  name: 'Test User Two',
  email: 'user2@example.com',
  password: 'password2',
  role: 'user',
};

const insertUsers = async (users) => {
  const usersWithHashedPassword = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return { ...user, password: hashedPassword };
    })
  );
  await User.bulkCreate(usersWithHashedPassword);
};

module.exports = {
  adminUser,
  userOne,
  userTwo,
  insertUsers,
};
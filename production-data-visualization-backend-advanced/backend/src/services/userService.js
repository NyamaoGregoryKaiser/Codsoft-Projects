const User = require('../models/user');
const AppError = require('../utils/AppError');

exports.getAllUsers = async () => {
  return User.findAll({ attributes: { exclude: ['password'] } });
};

exports.getUserById = async (id) => {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!user) {
    throw new AppError('No user found with that ID', 404);
  }
  return user;
};

exports.updateUser = async (id, userData) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('No user found with that ID', 404);
  }

  // Prevent changing password via this generic update
  if (userData.password) {
    throw new AppError('Password cannot be updated via this route. Use a dedicated password update route.', 400);
  }

  await user.update(userData);
  user.password = undefined; // Exclude password from response
  return user;
};

exports.deleteUser = async (id) => {
  const result = await User.destroy({ where: { id } });
  if (result === 0) {
    throw new AppError('No user found with that ID', 404);
  }
  return null; // Indicate successful deletion
};
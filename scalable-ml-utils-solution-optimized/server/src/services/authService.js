const bcrypt = require('bcryptjs');
const prisma = require('../models/prisma');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.registerUser = async (email, password, username, role = 'USER', saltRounds) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username,
      role: role.toUpperCase(),
    },
  });
  logger.info(`User registered: ${user.email}`);
  return user;
};

exports.loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }
  logger.info(`User logged in: ${user.email}`);
  return user;
};

exports.getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};
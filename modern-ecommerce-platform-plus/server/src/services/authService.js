```javascript
// server/src/services/authService.js
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status-codes');

const registerUser = async (userData) => {
  const { name, email, password } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'USER', // Default role
    },
  });

  const token = generateToken(user.id);
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  const token = generateToken(user.id);
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

const updateProfile = async (userId, updateData) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Prevent role changes via profile update, handle password separately
  if (updateData.role) delete updateData.role;
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  return updatedUser;
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateProfile,
};

```
```javascript
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const registerUser = async (username, email, password) => {
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser = await User.create({ username, email, password });
    const token = generateToken({ id: newUser.id, role: newUser.role });

    return { user: newUser, token };
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({ id: user.id, role: user.role });
    return { user, token };
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
};
```
```javascript
const jwt = require('jsonwebtoken');
const logger = require('../config/winston');

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // For HTTP-only cookie, you might use:
  // const options = {
  //   expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
  //   httpOnly: true
  // };
  // if (process.env.NODE_ENV === 'production') {
  //   options.secure = true;
  // }
  // res.status(statusCode).cookie('token', token, options).json({
  //   success: true,
  //   token
  // });

  // For client-side storage (localStorage, etc.)
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      rooms: user.rooms
    }
  });
};

// Verify JWT token for Socket.IO connections (simplified for example)
const verifySocketToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error(`Socket JWT verification failed: ${error.message}`);
    return null;
  }
};

module.exports = {
  sendTokenResponse,
  verifySocketToken
};
```
```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (userId, role) => {
  const payload = {
    sub: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000), // Issued at
  };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
```
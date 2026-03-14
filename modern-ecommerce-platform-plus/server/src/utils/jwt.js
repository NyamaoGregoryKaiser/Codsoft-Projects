```javascript
// server/src/utils/jwt.js
const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  return token;
};

const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  generateToken,
  verifyToken,
};

```
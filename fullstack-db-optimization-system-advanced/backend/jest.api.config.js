const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'API Tests',
  testMatch: ['<rootDir>/tests/api/**/*.test.js'],
  collectCoverageFrom: [
    "src/app.js",
    "src/routes/**/*.js"
  ],
  coverageDirectory: "./coverage/api",
};
```

#### `backend/jest.config.js` (Base Jest config for backend)
```javascript
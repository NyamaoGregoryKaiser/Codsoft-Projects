const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests',
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  collectCoverageFrom: [
    "src/controllers/**/*.js",
    "src/routes/**/*.js"
  ],
  coverageDirectory: "./coverage/integration",
};
```

#### `backend/jest.api.config.js`
```javascript
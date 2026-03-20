const baseConfig = require('./jest.config'); // Assuming jest.config.js exists at root of backend

module.exports = {
  ...baseConfig,
  displayName: 'Unit Tests',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  collectCoverageFrom: [
    "src/services/**/*.js",
    "src/utils/**/*.js",
    "!src/utils/scheduler.js" // Scheduler relies on external cron library
  ],
  coverageDirectory: "./coverage/unit",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### `backend/jest.integration.config.js`
```javascript
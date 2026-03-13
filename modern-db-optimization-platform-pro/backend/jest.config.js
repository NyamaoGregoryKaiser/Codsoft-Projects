```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/server.ts', '!<rootDir>/src/app.ts', '!<rootDir>/src/migrations/**/*.ts', '!<rootDir>/src/seeds/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['./tests/setup.ts'],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1"
  }
};
```
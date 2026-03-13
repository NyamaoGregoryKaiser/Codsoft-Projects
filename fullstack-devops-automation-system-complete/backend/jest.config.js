```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/config/*.ts',
    '!src/database/data-source.ts',
    '!src/database/entities/*.ts',
    '!src/database/migrations/*.ts',
    '!src/database/seeds/*.ts',
    '!src/routes/*.ts',
    '!src/types/*.ts',
    '!src/middleware/error-handler.ts', // Error handler usually tested via integration
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['dotenv/config'], // Load .env before tests
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  moduleNameMapper: {
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@database/(.*)$": "<rootDir>/src/database/$1",
    "^@entities/(.*)$": "<rootDir>/src/database/entities/$1",
    "^@migrations/(.*)$": "<rootDir>/src/database/migrations/$1",
    "^@seeds/(.*)$": "<rootDir>/src/database/seeds/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@types-src/(.*)$": "<rootDir>/src/types/$1"
  }
};
```
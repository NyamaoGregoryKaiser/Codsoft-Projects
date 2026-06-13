```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/src', '<rootDir>/tests'], // Look for tests in src and tests directories
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.ts$', // Only run .ts files in 'tests'
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // Exclude main server entry
    '!src/config/*.ts', // Exclude config files
    '!src/database/*.ts', // Exclude database setup scripts
    '!src/utils/logger.ts', // Logger is tested implicitly by other tests
    '!src/tests/**', // Exclude test files themselves from coverage
    '!src/models/**/*.ts' // Exclude interfaces/types from coverage
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFiles: ['dotenv/config'], // Load .env for tests
};
```
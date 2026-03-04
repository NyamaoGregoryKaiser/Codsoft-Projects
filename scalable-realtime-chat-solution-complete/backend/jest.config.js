```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/test-setup.ts',
    '/src/app.ts', // app.ts is mostly config, tested implicitly by routes
    '/src/server.ts', // server.ts is entry point, tested implicitly
    '/src/config/', // config files are tested implicitly
    '/src/routes/' // Routes are tested via integration tests, but not directly code-covered for statements
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Map @/ to src/ for imports
  }
};
```
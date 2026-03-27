import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts', // Exclude main server entry
    '!src/app.ts',    // Exclude app setup (integration tests will cover routes)
    '!src/db/**/*.ts', // Exclude DB setup, migrations, seeds (they are tested by integration with DB)
    '!src/docs/**/*.ts', // Exclude swagger docs
    '!src/types/**/*.ts', // Exclude types
    '!src/modules/**/*.routes.ts', // Exclude routes (API tests cover them)
    '!src/modules/**/*.controller.ts' // Exclude controllers (API tests cover them)
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
```

#### `pms-api/backend/tests/setup.ts`
```typescript
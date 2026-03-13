```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@types-frontend/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx', // Entry point usually not tested
    '!src/App.tsx', // Main app setup
    '!src/vite-env.d.ts',
    '!src/setupTests.ts', // Test setup file
    '!src/types/*.ts', // Type definitions
    '!src/api/axios.ts', // Axios instance
    '!src/hooks/useAuth.ts', // Context consumer/provider
    '!src/context/AuthContext.tsx', // Context definition
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```
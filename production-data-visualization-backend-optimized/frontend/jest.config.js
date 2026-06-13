```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
      '^@/(.*)$': '<rootDir>/src/$1', // Alias for src folder
    },
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
      '^.+\\.(js|jsx)$': 'babel-jest', // For JS/JSX files
    },
    transformIgnorePatterns: [
      '/node_modules/(?!axios)/', // Transform axios for CJS environments, or any other ESM module that Jest struggles with
    ],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/index.tsx', // Exclude main entry file
        '!src/reportWebVitals.ts', // Exclude web vitals
        '!src/setupTests.ts', // Exclude test setup
        '!src/react-app-env.d.ts' // Exclude type declarations
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  };
```
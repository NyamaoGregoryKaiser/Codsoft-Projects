module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest', // For JS files, e.g., if you have any in common
  },
  testMatch: [
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/App.tsx',
    '!src/vite-env.d.ts',
    '!src/types.ts',
    '!src/**/*.d.ts',
    '!src/setupTests.ts',
    '!src/components/common/ToastContainer.tsx', // This is mostly layout/wrapper
    '!src/contexts/ToastContext.tsx', // Context logic is hard to test directly
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};
// Mock Prisma client globally for tests
const { PrismaClient } = require('@prisma/client');
const { mockDeep, mockReset } = require('jest-mock-extended');

jest.mock('@config/db', () => ({
  __esModule: true,
  default: mockDeep(),
}));

// This mock is for the PrismaClient constructor itself
// Used when testing logic that instantiates PrismaClient, e.g., in a standalone script or service
jest.mock('@prisma/client', () => {
  const actualPrisma = jest.requireActual('@prisma/client');
  return {
    ...actualPrisma,
    PrismaClient: jest.fn(() => mockDeep()), // Mock the constructor
  };
});


beforeEach(() => {
  // Reset all mocks before each test
  mockReset(require('@config/db'));
  // If you mock the PrismaClient constructor, you might also need to reset that if new instances are created.
  // For most service/controller tests using the singleton, resetting the imported 'db' is sufficient.
});
```

#### `backend/tests/unit/services/authService.test.js`
```javascript
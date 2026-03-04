```typescript
import { prisma } from './config/prisma';
import { io } from './server'; // Import io instance if needed for mocks, or if you test sockets directly

// Before all tests, clear the database and re-seed
beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must be run in TEST environment. Please set NODE_ENV=test');
  }

  // Truncate tables and reset sequences for a clean state
  await prisma.$executeRaw`TRUNCATE TABLE "users", "channels", "channel_memberships", "messages" RESTART IDENTITY CASCADE;`;
  console.log('Database cleaned before tests.');

  // Optionally seed some common test data
  // For complex seeding, call the seed script:
  // await execa('ts-node', ['prisma/seed.ts'], { stdio: 'inherit' });
  // For simplicity, we can create minimal data here or in individual tests.
});

// After all tests, disconnect Prisma
afterAll(async () => {
  await prisma.$disconnect();
});

// Mock Socket.IO server for testing controllers/services that interact with it
// This mock allows us to assert if specific socket events were emitted
jest.mock('./server', () => {
  const mockEmit = jest.fn();
  const mockTo = jest.fn(() => ({ emit: mockEmit }));

  return {
    io: {
      emit: mockEmit,
      to: mockTo,
      // Add other methods if needed, e.g., on, use
    },
  };
});
```
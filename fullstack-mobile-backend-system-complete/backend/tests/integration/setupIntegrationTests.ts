import prisma from '../../src/config/prismaClient';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// This setup runs once before all integration tests
beforeAll(async () => {
  // Clear the database before running tests
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed test data
  const hashedPasswordAdmin = await bcrypt.hash('password123', 10);
  const hashedPasswordUser = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { id: 'auth-test-admin-id', email: 'admin@test.com', password: hashedPasswordAdmin, name: 'Test Admin', role: 'ADMIN' },
      { id: 'auth-test-user-id', email: 'user@test.com', password: hashedPasswordUser, name: 'Test User', role: 'USER' },
    ],
  });

  await prisma.task.createMany({
    data: [
      { id: 'task-test-id-1', title: 'User Task 1', userId: 'auth-test-user-id' },
      { id: 'task-test-id-2', title: 'User Task 2', userId: 'auth-test-user-id' },
      { id: 'task-test-id-3', title: 'Admin Task 1', userId: 'auth-test-admin-id' },
    ],
  });
});

// This teardown runs once after all integration tests
afterAll(async () => {
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});
```

### `backend/tests/integration/auth.api.test.ts` (Example API/Integration Test)
```typescript
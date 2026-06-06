```javascript
// jest.setup.js
require('dotenv').config({ path: '.env.test' }); // Load test environment variables
// Mock Prisma client if you want to mock all DB calls globally
// jest.mock('./src/database/prisma', () => ({
//   __esModule: true,
//   default: {
//     user: {
//       findUnique: jest.fn(),
//       create: jest.fn(),
//       update: jest.fn(),
//       delete: jest.fn(),
//     },
//     project: { /* ... */ },
//     task: { /* ... */ },
//     $disconnect: jest.fn(),
//   },
// }));

// Mock Redis client globally
// jest.mock('./src/utils/redis', () => ({
//   __esModule: true,
//   default: {
//     get: jest.fn(),
//     setEx: jest.fn(),
//     del: jest.fn(),
//     connect: jest.fn(),
//     disconnect: jest.fn(),
//   },
// }));
```
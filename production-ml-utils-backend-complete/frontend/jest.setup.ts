```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
// Optional: If you need to mock specific browser APIs or global objects
// For example, if you use fetch or localStorage directly
// global.fetch = jest.fn();
// Object.defineProperty(window, 'localStorage', {
//   value: {
//     getItem: jest.fn(),
//     setItem: jest.fn(),
//     removeItem: jest.fn(),
//     clear: jest.fn(),
//   },
//   writable: true,
// });
```
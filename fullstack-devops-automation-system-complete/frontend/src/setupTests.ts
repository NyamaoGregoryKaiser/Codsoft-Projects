```typescript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (function () {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console.error/warn to prevent test logs from cluttering output
// Optional: Remove if you want to see all console output during tests
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
```
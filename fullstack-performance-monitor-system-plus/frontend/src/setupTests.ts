// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mocking window.navigator.clipboard for components that use it
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
  writable: true,
});

// Mocking environment variables for tests
// Vite uses import.meta.env
// For Jest, we can define it globally
global.import = {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:5000/api', // Default test API URL
      // Add other VITE_ variables here if used in tests
    },
  },
} as any;
```

```
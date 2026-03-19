import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Polyfill for fetch API in Node.js environment

// Mock window.scrollTo since JSDOM doesn't implement it
window.scrollTo = jest.fn();

// Mock localStorage for tests
const localStorageMock = (function() {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock environment variables for client-side tests
// Ensure VITE_API_BASE_URL is defined if used in tests
process.env.VITE_API_BASE_URL = 'http://localhost:5000/api/v1';
```
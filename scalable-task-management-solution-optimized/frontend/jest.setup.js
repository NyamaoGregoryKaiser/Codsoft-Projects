import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';

// Mock matchMedia for Chakra UI
window.matchMedia = jest.fn().mockImplementation(query => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});

// Mock TextEncoder and TextDecoder for jwt-decode in test environment
Object.defineProperty(global, 'TextEncoder', { value: TextEncoder });
Object.defineProperty(global, 'TextDecoder', { value: TextDecoder });

// Mock Cookies for js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
}));

// Mock Zustand for easier testing of components that use stores
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn((selector) => selector({
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
    accessToken: null,
  })),
}));
```
**(Note: The Zustand mock above is a simple global mock. For more granular testing, you might reset or provide specific state for each test.)**
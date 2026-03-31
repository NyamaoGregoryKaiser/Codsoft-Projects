import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Mock jwtDecode to control authentication state for tests
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
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

describe('App Component', () => {
  beforeEach(() => {
    localStorageMock.clear(); // Clear local storage before each test
    jwtDecode.mockClear(); // Clear mock calls
  });

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders login and register links when not authenticated', async () => {
    jwtDecode.mockImplementation(() => {
      throw new Error('No token'); // Simulate no token or invalid token
    });
    localStorageMock.getItem.mockReturnValue(null);

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.getByText(/register/i)).toBeInTheDocument();
      expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    });
  });

  test('renders dashboard and profile links when authenticated as USER', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YiI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOiJST0xFX1VTRVIiLCJpYXQiOjE2NzgzMjUyMDAsImV4cCI6NDg3ODMyNTIwMH0.fakeSignature';
    localStorageMock.getItem.mockReturnValue(mockToken);
    jwtDecode.mockReturnValue({
      userId: 1,
      sub: 'testuser',
      email: 'test@example.com',
      roles: 'ROLE_USER',
      exp: Date.now() / 1000 + 3600, // Valid for 1 hour
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      expect(screen.queryByText(/admin/i)).not.toBeInTheDocument(); // Admin link should not be present
      expect(screen.getByText(/logout \(testuser\)/i)).toBeInTheDocument();
    });
  });

  test('renders admin link when authenticated as ADMIN', async () => {
    const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInN1YiI6ImFkbWludXNlciIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlcyI6IlJPTEVfVVNFUixST0xFX0FETUlOIiwiaWF0IjoxNjc4MzI1MjAwLCJleHAiOjQ4NzgzMjUyMDB9.fakeSignature';
    localStorageMock.getItem.mockReturnValue(mockAdminToken);
    jwtDecode.mockReturnValue({
      userId: 2,
      sub: 'adminuser',
      email: 'admin@example.com',
      roles: 'ROLE_USER,ROLE_ADMIN',
      exp: Date.now() / 1000 + 3600, // Valid for 1 hour
    });

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/my notes/i)).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument(); // Admin link should be present
      expect(screen.getByText(/logout \(adminuser\)/i)).toBeInTheDocument();
    });
  });

  test('redirects to login if token is expired', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInN1YiI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOiJST0xFX1VTRVIiLCJpYXQiOjE2NzgzMjUyMDAsImV4cCI6MTY3ODMyNTIwMH0.expiredSignature'; // exp in the past
    localStorageMock.setItem('accessToken', expiredToken);
    jwtDecode.mockReturnValue({
      userId: 1,
      sub: 'testuser',
      email: 'test@example.com',
      roles: 'ROLE_USER',
      exp: Date.now() / 1000 - 100, // Expired time
    });

    renderApp();

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
  });
});
```

---

### 6. Documentation

#### `README.md`

```markdown
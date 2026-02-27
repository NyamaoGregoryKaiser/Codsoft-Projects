import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { AuthContext } from '../auth/AuthContext'; // Mock AuthContext
import { vi } from 'vitest'; // Using vitest's vi for mocking

// Mock the AuthContext values
const mockAuthContextValue = {
  isAuthenticated: false,
  user: null,
  loading: false,
  authError: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  loadUserFromToken: vi.fn(),
};

// Custom render function to wrap with AuthProvider (mocked) and BrowserRouter
const renderWithProviders = (ui, { providerProps, ...renderOptions } = {}) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ ...mockAuthContextValue, ...providerProps }}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>,
    renderOptions
  );
};


describe('App Component', () => {
  it('renders login page for unauthenticated user', async () => {
    await act(async () => {
      renderWithProviders(<App />, { providerProps: { isAuthenticated: false, loading: false } });
    });
    // Check for elements that would indicate the LoginPage is rendered
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders project list page for authenticated user', async () => {
    // Mock user details
    const authenticatedUser = { username: 'testuser', role: 'USER', id: 1 };
    await act(async () => {
      renderWithProviders(<App />, {
        providerProps: { isAuthenticated: true, user: authenticatedUser, loading: false },
      });
    });
    // Check for elements that would indicate the ProjectListPage is rendered
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello, testuser/i)).toBeInTheDocument();
  });

  it('shows loading message when auth context is loading', () => {
    renderWithProviders(<App />, { providerProps: { loading: true } });
    expect(screen.getByText(/Loading application.../i)).toBeInTheDocument();
  });

  it('renders Header component', async () => {
    await act(async () => {
      renderWithProviders(<App />, { providerProps: { isAuthenticated: false, loading: false } });
    });
    expect(screen.getByText(/ProjectPulse/i)).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```
**`frontend/src/tests/LoginForm.test.js`**
```javascript
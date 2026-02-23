```javascript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '../App';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext
import { act } from 'react-dom/test-utils'; // For state updates

// Mock AuthProvider value for tests
const mockAuthContextValue = {
  isAuthenticated: false,
  user: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
};

describe('App Routing and Auth', () => {
  test('renders login page for unauthenticated user by default', async () => {
    act(() => {
      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <App />
        </AuthContext.Provider>
      );
    });
    
    // Expect the Navbar to be present
    expect(screen.getByText(/Dashboard App/i)).toBeInTheDocument();
    
    // Expect login elements on the page (from AuthForm)
    await waitFor(() => {
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  test('renders dashboards page for authenticated user', async () => {
    // Override mock context for authenticated state
    const authenticatedAuthContextValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: { id: 1, username: 'testuser', roles: ['user'] },
    };

    act(() => {
      render(
        <AuthContext.Provider value={authenticatedAuthContextValue}>
          <App />
        </AuthContext.Provider>
      );
    });

    // Expect to see elements from the Navbar for authenticated users
    expect(screen.getByText(/Dashboards/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    
    // Since App.js redirects to /dashboards, we should see its content
    await waitFor(() => {
        expect(screen.getByText(/Welcome to your Dashboards/i)).toBeInTheDocument();
    });
  });

  test('renders editor-specific links for editor role', async () => {
    const editorAuthContextValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: { id: 2, username: 'editoruser', roles: ['editor'] },
    };

    act(() => {
      render(
        <AuthContext.Provider value={editorAuthContextValue}>
          <App />
        </AuthContext.Provider>
      );
    });

    expect(screen.getByText(/Visualizations/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Sources/i)).toBeInTheDocument();
  });

  test('does not render editor-specific links for non-editor role', async () => {
    const userAuthContextValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: { id: 3, username: 'normaluser', roles: ['user'] },
    };

    act(() => {
      render(
        <AuthContext.Provider value={userAuthContextValue}>
          <App />
        </AuthContext.Provider>
      );
    });

    expect(screen.queryByText(/Visualizations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Data Sources/i)).not.toBeInTheDocument();
  });

  test('redirects unauthenticated user from private route', async () => {
    // Render with unauthenticated context, try to go to /data-sources (private)
    act(() => {
      render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <Router initialEntries={["/data-sources"]}>
            <App />
          </Router>
        </AuthContext.Provider>
      );
    });

    // Should be redirected to /login
    await waitFor(() => {
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    });
  });
});

```
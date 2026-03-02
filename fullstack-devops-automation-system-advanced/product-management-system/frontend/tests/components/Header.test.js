import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from '../../src/components/Header';
import { AuthContext } from '../../src/context/AuthContext'; // Import AuthContext
import '@testing-library/jest-dom';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Header Component', () => {
  // Mock AuthContext values for authenticated state
  const authenticatedUserContext = {
    user: { id: '123', username: 'testuser' },
    token: 'mock-token',
    logout: jest.fn(),
  };

  // Mock AuthContext values for unauthenticated state
  const unauthenticatedUserContext = {
    user: null,
    token: null,
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('renders correctly for unauthenticated user', () => {
    render(
      <AuthContext.Provider value={unauthenticatedUserContext}>
        <Router>
          <Header />
        </Router>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('My Products')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders correctly for authenticated user', () => {
    render(
      <AuthContext.Provider value={authenticatedUserContext}>
        <Router>
          <Header />
        </Router>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Product Manager')).toBeInTheDocument();
    expect(screen.getByText('My Products')).toBeInTheDocument();
    expect(screen.getByText('Add Product')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('calls logout and navigates to login on logout button click', () => {
    render(
      <AuthContext.Provider value={authenticatedUserContext}>
        <Router>
          <Header />
        </Router>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(authenticatedUserContext.logout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to home when "Product Manager" title is clicked', () => {
    render(
      <AuthContext.Provider value={unauthenticatedUserContext}>
        <Router>
          <Header />
        </Router>
      </AuthContext.Provider>
    );

    const homeLink = screen.getByRole('link', { name: /Product Manager/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
```

```
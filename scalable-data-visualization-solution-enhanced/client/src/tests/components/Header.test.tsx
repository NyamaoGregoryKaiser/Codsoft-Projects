```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from 'components/common/Header';
import { AuthContext } from 'contexts/AuthContext';
import { UserRole } from 'types/auth';

// Mock AuthContext values
const mockAuthContextValue = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  fetchUser: jest.fn(),
};

describe('Header Component', () => {
  it('renders Login and Register buttons when not authenticated', () => {
    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    expect(screen.queryByText(/Datasets/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
  });

  it('renders Datasets, Visualizations, Dashboards, and Logout buttons when authenticated', () => {
    const authenticatedAuthContextValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: UserRole.USER },
    };

    render(
      <Router>
        <AuthContext.Provider value={authenticatedAuthContextValue}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByText(/Datasets/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualizations/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboards/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello, testuser \(user\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
  });

  it('renders "DataViz Hub" title as a link to home', () => {
    render(
      <Router>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    const titleLink = screen.getByText(/DataViz Hub/i);
    expect(titleLink).toBeInTheDocument();
    expect(titleLink.closest('a')).toHaveAttribute('href', '/');
  });
});
```
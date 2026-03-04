import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../auth/AuthContext';
import Header from './Header';

// Mock the AuthContext values for different scenarios
const mockAuthContext = (user, isAdmin, handleLogout = jest.fn()) => ({
  user,
  isLoading: false,
  isAdmin,
  handleLogout,
  handleLogin: jest.fn(),
  handleRegister: jest.fn(),
  token: user ? 'some_token' : null,
});

describe('Header Component', () => {
  it('renders navigation links for unauthenticated user', () => {
    const authValues = mockAuthContext(null, false);
    render(
      <Router>
        <AuthContext.Provider value={authValues}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByText(/E-Shop/i)).toBeInTheDocument();
    expect(screen.getByText(/Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Users \(Admin\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
  });

  it('renders navigation links for authenticated regular user', () => {
    const authValues = mockAuthContext({ id: '1', username: 'testuser', role: 'user' }, false);
    render(
      <Router>
        <AuthContext.Provider value={authValues}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByText(/Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout \(testuser\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Register/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Users \(Admin\)/i)).not.toBeInTheDocument();
  });

  it('renders navigation links for authenticated admin user', () => {
    const authValues = mockAuthContext({ id: '1', username: 'adminuser', role: 'admin' }, true);
    render(
      <Router>
        <AuthContext.Provider value={authValues}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    expect(screen.getByText(/Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Users \(Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout \(adminuser\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Register/i)).not.toBeInTheDocument();
  });

  it('calls handleLogout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    const authValues = mockAuthContext({ id: '1', username: 'testuser', role: 'user' }, false, mockLogout);
    render(
      <Router>
        <AuthContext.Provider value={authValues}>
          <Header />
        </AuthContext.Provider>
      </Router>
    );

    fireEvent.click(screen.getByText(/Logout \(testuser\)/i));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
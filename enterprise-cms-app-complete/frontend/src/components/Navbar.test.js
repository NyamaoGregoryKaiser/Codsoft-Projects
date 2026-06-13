import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './Navbar';
import AuthContext from '../utils/AuthContext';

// Mock the AuthContext values
const mockLoggedInUser = {
  id: '123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'author',
};

const mockAdminUser = {
  id: '456',
  username: 'adminuser',
  email: 'admin@example.com',
  role: 'admin',
};

const mockLogout = jest.fn();

const renderNavbar = (user = null) => {
  render(
    <Router>
      <AuthContext.Provider value={{ user, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    </Router>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mockLogout calls before each test
  });

  it('renders site title', () => {
    renderNavbar();
    expect(screen.getByText(/CMS Project/i)).toBeInTheDocument();
  });

  it('shows Login and Register links when not logged in', () => {
    renderNavbar();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
    expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
  });

  it('shows Dashboard, Profile, and Logout links when logged in', () => {
    renderNavbar(mockLoggedInUser);
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Register/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile \(testuser\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('calls logout function when Logout button is clicked', () => {
    renderNavbar(mockLoggedInUser);
    fireEvent.click(screen.getByText(/Logout/i));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('shows "My Posts" and "Media" links for author role', () => {
    renderNavbar(mockLoggedInUser);
    expect(screen.getByText(/My Posts/i)).toBeInTheDocument();
    expect(screen.getByText(/Media/i)).toBeInTheDocument();
    expect(screen.queryByText(/Categories/i)).not.toBeInTheDocument(); // Authors don't manage categories
  });

  it('shows "Categories" link for admin role', () => {
    renderNavbar(mockAdminUser);
    expect(screen.getByText(/My Posts/i)).toBeInTheDocument();
    expect(screen.getByText(/Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Media/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile \(adminuser\)/i)).toBeInTheDocument();
  });
});
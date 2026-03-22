```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AuthProvider, useAuth } from '../../context/AuthContext'; // Import AuthProvider and useAuth

// Mock the AuthContext for testing purposes
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'), // Use actual for non-mocked parts
  useAuth: jest.fn(), // Mock the useAuth hook
}));

describe('Sidebar', () => {
  const renderSidebar = (userRole = 'USER') => {
    // Set the mocked return value for useAuth
    useAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com', role: userRole },
      isAuthenticated: true,
      loading: false,
    });

    render(
      <Router>
        <Sidebar />
      </Router>
    );
  };

  it('renders common navigation links for a regular user', () => {
    renderSidebar('USER');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('does not render admin-only links for a regular user', () => {
    renderSidebar('USER');

    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('renders all navigation links for an admin user', () => {
    renderSidebar('ADMIN');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument(); // Admin-only link
  });

  it('highlights the active link based on current path', () => {
    // Mock useLocation to control the current path
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => ({ pathname: '/projects' }),
    }));

    renderSidebar('USER');

    const projectsLink = screen.getByText('Projects').closest('a');
    expect(projectsLink).toHaveClass('bg-indigo-700'); // Check for active class
    expect(projectsLink).toHaveClass('text-white');

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveClass('bg-indigo-700');
  });

  it('displays the brand name', () => {
    renderSidebar();
    expect(screen.getByText('TaskFlow')).toBeInTheDocument();
  });

  it('displays copyright information', () => {
    renderSidebar();
    expect(screen.getByText(`© ${new Date().getFullYear()} TaskFlow. All rights reserved.`)).toBeInTheDocument();
  });
});
```
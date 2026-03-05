import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';
import { AuthContext } from '../../context/AuthContext'; // Directly import context for mocking
import { ConfigProvider } from 'antd';

// Mock child components/pages rendered by Outlet for simplicity
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div>Mock Outlet Content</div>,
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/dashboard' })), // Default location
}));

describe('AppLayout Component', () => {
  const mockLogout = jest.fn();
  const mockUser = { id: 1, username: 'testuser', email: 'test@test.com', role: 'user' };
  const mockAdminUser = { id: 2, username: 'admin', email: 'admin@test.com', role: 'admin' };

  const renderAppLayout = (user = mockUser) => {
    require('react-router-dom').useNavigate.mockReturnValue(jest.fn()); // Reset useNavigate mock
    render(
      <ConfigProvider>
        <MemoryRouter>
          <AuthContext.Provider value={{ isAuthenticated: true, user, logout: mockLogout }}>
            <AppLayout />
          </AuthContext.Provider>
        </MemoryRouter>
      </ConfigProvider>
    );
  };

  test('renders sidebar with navigation items for regular user', () => {
    renderAppLayout();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Connections/i)).toBeInTheDocument();
    expect(screen.getByText(/Query Optimizer/i)).toBeInTheDocument();
    expect(screen.getByText(/Metrics Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/Schema Viewer/i)).toBeInTheDocument();
    expect(screen.queryByText(/User Management/i)).not.toBeInTheDocument(); // Not for regular user
  });

  test('renders sidebar with User Management for admin user', () => {
    renderAppLayout(mockAdminUser);
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });

  test('toggles sidebar collapsed state', () => {
    renderAppLayout();
    const toggleButton = screen.getByRole('button', { name: /menu-fold/i });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /menu-unfold/i })).toBeInTheDocument(); // Button icon changes

    fireEvent.click(screen.getByRole('button', { name: /menu-unfold/i }));
    expect(screen.getByRole('button', { name: /menu-fold/i })).toBeInTheDocument();
  });

  test('displays username in header dropdown', () => {
    renderAppLayout();
    fireEvent.click(screen.getByText(mockUser.username)); // Open dropdown
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test('calls logout and redirects on logout click', async () => {
    const mockNavigate = jest.fn();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    renderAppLayout();

    fireEvent.click(screen.getByText(mockUser.username)); // Open dropdown
    fireEvent.click(screen.getByText(/Logout/i));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('renders mock outlet content', () => {
    renderAppLayout();
    expect(screen.getByText(/Mock Outlet Content/i)).toBeInTheDocument();
  });
});
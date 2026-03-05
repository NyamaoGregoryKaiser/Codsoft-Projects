import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import Cookies from 'js-cookie';
import * as authApi from './api/auth';
import { ConfigProvider } from 'antd'; // Wrap with ConfigProvider for Ant Design components

// Mock react-chartjs-2 as it causes issues in JSDOM environment
jest.mock('react-chartjs-2', () => ({
  Line: () => null,
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear cookies and mocks before each test
    Cookies.remove('token');
    jest.clearAllMocks();
  });

  const renderAppWithAuth = (initialEntries = ['/'], isAuthenticated = false, user = null) => {
    // Mock Cookies.get for specific test cases
    jest.spyOn(Cookies, 'get').mockReturnValue(isAuthenticated ? 'mock-token' : undefined);
    // Mock fetchMe for specific test cases
    jest.spyOn(authApi, 'getMe').mockImplementation(() =>
      isAuthenticated ? Promise.resolve(user || { id: 1, username: 'test', email: 'test@test.com', role: 'user' }) : Promise.reject(new Error('Not authenticated'))
    );

    render(
      <ConfigProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      </ConfigProvider>
    );
  };

  test('redirects to login if not authenticated and trying to access a protected route', async () => {
    renderAppWithAuth(['/dashboard'], false);
    await waitFor(() => {
      expect(screen.getByText(/DBTune Login/i)).toBeInTheDocument();
    });
  });

  test('renders dashboard if authenticated', async () => {
    renderAppWithAuth(['/'], true);
    await waitFor(() => {
      expect(screen.getByText(/Dashboard Overview/i)).toBeInTheDocument();
    });
  });

  test('renders login page directly if path is /login', async () => {
    renderAppWithAuth(['/login'], false);
    await waitFor(() => {
      expect(screen.getByText(/DBTune Login/i)).toBeInTheDocument();
    });
  });

  test('renders register page directly if path is /register', async () => {
    renderAppWithAuth(['/register'], false);
    await waitFor(() => {
      expect(screen.getByText(/DBTune Register/i)).toBeInTheDocument();
    });
  });

  test('admin user can access User Management page', async () => {
    const adminUser = { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' };
    renderAppWithAuth(['/users'], true, adminUser);
    await waitFor(() => {
      expect(screen.getByText(/User Management/i)).toBeInTheDocument();
    });
  });

  test('non-admin user is redirected from User Management page', async () => {
    const regularUser = { id: 2, username: 'user', email: 'user@test.com', role: 'user' };
    renderAppWithAuth(['/users'], true, regularUser);
    await waitFor(() => {
      // Should redirect to dashboard
      expect(screen.getByText(/Dashboard Overview/i)).toBeInTheDocument();
    });
  });
});
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './components/AuthProvider';
import domsApi from './api/domsApi';

// Mock domsApi to control API responses during tests
jest.mock('./api/domsApi');
const mockedDomsApi = domsApi as jest.Mocked<typeof domsApi>;

describe('App Component (Integration)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset mocks
    mockedDomsApi.post.mockReset();
    mockedDomsApi.get.mockReset();
  });

  it('should redirect to login if not authenticated and trying to access a private route', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    );

    // Initial load, should go to /dashboard due to Navigate, then redirect to /login
    await waitFor(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
  });

  it('should allow login and redirect to dashboard', async () => {
    mockedDomsApi.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token',
        user: { id: '123', email: 'test@example.com', role: 'USER' },
        message: 'Logged in successfully',
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    );

    await act(async () => {
      userEvent.type(screen.getByLabelText(/Email:/i), 'test@example.com');
      userEvent.type(screen.getByLabelText(/Password:/i), 'password123');
      userEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Welcome, test@example.com!/i)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: '123', email: 'test@example.com', role: 'USER' }));
  });

  it('should show error message on failed login', async () => {
    mockedDomsApi.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    );

    await act(async () => {
      userEvent.type(screen.getByLabelText(/Email:/i), 'wrong@example.com');
      userEvent.type(screen.getByLabelText(/Password:/i), 'wrongpassword');
      userEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should navigate to target databases list after login and clicking link', async () => {
    mockedDomsApi.post.mockResolvedValueOnce({
      data: {
        token: 'fake-token',
        user: { id: '123', email: 'test@example.com', role: 'USER' },
        message: 'Logged in successfully',
      },
    });

    mockedDomsApi.get.mockResolvedValueOnce({
      data: [
        { id: 'db1', name: 'Prod DB', type: 'PostgreSQL', owner: { email: 'admin@example.com' } },
      ],
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    );

    // Login first
    await act(async () => {
      userEvent.type(screen.getByLabelText(/Email:/i), 'test@example.com');
      userEvent.type(screen.getByLabelText(/Password:/i), 'password123');
      userEvent.click(screen.getByRole('button', { name: /Login/i }));
    });

    // Wait for dashboard and then click link
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    await act(async () => {
      userEvent.click(screen.getByRole('link', { name: /Target Databases/i }));
    });

    // Wait for the target databases list to appear
    await waitFor(() => {
      expect(screen.getByText(/Target Databases/i)).toBeInTheDocument();
      expect(screen.getByText(/Prod DB/i)).toBeInTheDocument();
      expect(screen.getByText(/PostgreSQL/i)).toBeInTheDocument();
    });
  });

  it('should show 404 for unknown routes', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    );
    // Directly navigate to an unknown path (Router does this internally)
    window.history.pushState({}, 'Test page', '/unknown-route');
    await waitFor(() => {
      expect(screen.getByText(/404 - Page Not Found/i)).toBeInTheDocument();
    });
  });
});
```
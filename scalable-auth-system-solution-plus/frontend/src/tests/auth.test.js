import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from '../api/axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

import { AuthProvider } from '../contexts/AuthContext';
import Register from '../components/auth/Register';
import Login from '../components/auth/Login';
import Profile from '../components/user/Profile';
import useAuth from '../hooks/useAuth';

// Mock axios post requests
jest.mock('../api/axios');

// Mock `useNavigate` from `react-router-dom`
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    axios.post.mockClear();
    axios.get.mockClear();
    Cookies.set.mockClear();
    Cookies.remove.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    mockedUsedNavigate.mockClear();

    // Reset local storage mock
    localStorage.clear();
  });

  // --- Register Component Tests ---
  test('renders Register component', () => {
    render(<Router><Register /></Router>);
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER'],
      },
    });

    render(<Router><AuthProvider><Register /></AuthProvider></Router>);

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(Cookies.set).toHaveBeenCalledWith('accessToken', 'mockAccessToken', { expires: 1 / 24, secure: true, sameSite: 'Strict' }); // Approx 1 hour (default in backend)
      expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', { expires: 7, secure: true, sameSite: 'Strict' }); // Approx 7 days (default in backend)
      expect(localStorage.getItem('user')).toBe(JSON.stringify({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER'],
      }));
      expect(toast.success).toHaveBeenCalledWith('Registration successful!');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles registration failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'User already exists' } },
    });

    render(<Router><AuthProvider><Register /></AuthProvider></Router>);

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Registration failed: User already exists');
    });
  });

  // --- Login Component Tests ---
  test('renders Login component', () => {
    render(<Router><Login /></Router>);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        accessToken: 'mockAccessToken',
        refreshToken: 'mockRefreshToken',
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER'],
      },
    });

    render(<Router><AuthProvider><Login /></AuthProvider></Router>);

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(Cookies.set).toHaveBeenCalledWith('accessToken', 'mockAccessToken', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', expect.any(Object));
      expect(localStorage.getItem('user')).toBe(JSON.stringify({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        roles: ['USER'],
      }));
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(<Router><AuthProvider><Login /></AuthProvider></Router>);

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Login failed: Invalid credentials');
    });
  });

  // --- Profile Component Tests (requires AuthContext) ---
  test('renders Profile component with user data', async () => {
    const mockUser = {
      userId: 1,
      username: 'loggeduser',
      email: 'logged@example.com',
      roles: ['USER'],
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    Cookies.set('accessToken', 'mockToken'); // Simulate logged in state

    axios.get.mockResolvedValueOnce({ data: { ...mockUser, username: 'updated_loggeduser' } });
    axios.put.mockResolvedValueOnce({ data: { ...mockUser, username: 'updated_loggeduser' } });

    render(<Router><AuthProvider><Profile /></AuthProvider></Router>);

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toHaveValue('loggeduser');
      expect(screen.getByLabelText(/email/i)).toHaveValue('logged@example.com');
    });

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'updated_loggeduser' } });
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/users/me', expect.objectContaining({ username: 'updated_loggeduser' }));
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
      expect(localStorage.getItem('user')).toContain('updated_loggeduser');
    });
  });

  test('logout clears auth state and navigates to home', async () => {
    const mockUser = { userId: 1, username: 'test', email: 'test@test.com', roles: ['USER'] };
    localStorage.setItem('user', JSON.stringify(mockUser));
    Cookies.set('accessToken', 'mockAccessToken');
    Cookies.set('refreshToken', 'mockRefreshToken');

    // Render a dummy component that uses useAuth to trigger logout
    const DummyComponent = () => {
      const { logout } = useAuth();
      return <button onClick={logout}>Logout</button>;
    };

    render(<Router><AuthProvider><DummyComponent /></AuthProvider></Router>);

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(Cookies.remove).toHaveBeenCalledWith('accessToken');
      expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.getItem('user')).toBeNull();
      expect(toast.info).toHaveBeenCalledWith('Logged out successfully.');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
    });
  });
});
```
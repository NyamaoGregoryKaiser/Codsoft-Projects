```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../../components/Auth/Login';
import { AuthContext } from '../../contexts/AuthContext';
import * as api from '../../api'; // Mock the API calls
import { BrowserRouter as Router } from 'react-router-dom';

// Mock the API calls
jest.mock('../../api', () => ({
  login: jest.fn(),
}));

const mockLogin = jest.fn(); // Mock the login function from AuthContext

const renderWithContextAndRouter = (component) => {
  return render(
    <AuthContext.Provider value={{ isAuthenticated: false, login: mockLogin, logout: jest.fn(), user: null }}>
      <Router>{component}</Router>
    </AuthContext.Provider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithContextAndRouter(<Login />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('allows typing in email and password fields', () => {
    renderWithContextAndRouter(<Login />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('calls API login and context login on successful submission', async () => {
    api.login.mockResolvedValue({
      data: {
        token: 'mock-token',
        user: { id: '1', email: 'test@example.com' },
      },
    });

    renderWithContextAndRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockLogin).toHaveBeenCalledWith('mock-token', { id: '1', email: 'test@example.com' });
    });
  });

  it('displays error message on failed login', async () => {
    api.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderWithContextAndRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    api.login.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: { token: 't', user: {} } }), 100)));

    renderWithContextAndRouter(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    expect(screen.getByRole('button', { name: /Logging in.../i })).toBeInTheDocument();
    await waitFor(() => expect(api.login).toHaveBeenCalled());
  });
});
```
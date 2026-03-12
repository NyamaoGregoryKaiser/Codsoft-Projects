```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthForm from '../../components/AuthForm';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('AuthForm Component', () => {
  const mockLogin = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    require('../../hooks/useAuth').useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
    });
  });

  // Helper to render the component with AuthProvider context
  const renderWithAuth = (ui, { providerProps, ...renderOptions } = {}) => {
    return render(
      <Router>
        <AuthContext.Provider value={providerProps}>
          {ui}
        </AuthContext.Provider>
      </Router>,
      renderOptions
    );
  };

  describe('Login Form', () => {
    it('renders login form correctly', () => {
      renderWithAuth(<AuthForm type="login" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Username:/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Confirm Password:/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithAuth(<AuthForm type="login" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        expect(toast.error).not.toHaveBeenCalled(); // No error toast on success
      });
    });

    it('displays error message on failed login', async () => {
      mockLogin.mockResolvedValue(false);

      renderWithAuth(<AuthForm type="login" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'wrongpass' } });
      fireEvent.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/An error occurred\. Please check the console for details\./i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('displays error for missing email/password', async () => {
      renderWithAuth(<AuthForm type="login" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Email and password are required\./i)).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });
  });

  describe('Register Form', () => {
    it('renders register form correctly', () => {
      renderWithAuth(<AuthForm type="register" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Username:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    });

    it('handles successful registration', async () => {
      mockRegister.mockResolvedValue(true);

      renderWithAuth(<AuthForm type="register" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.change(screen.getByLabelText(/Username:/i), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'securepass' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password:/i), { target: { value: 'securepass' } });
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', 'securepass');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('displays error for mismatched passwords', async () => {
      renderWithAuth(<AuthForm type="register" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.change(screen.getByLabelText(/Username:/i), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'pass1' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password:/i), { target: { value: 'pass2' } });
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match\./i)).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('displays error for missing username/confirm password on register', async () => {
      renderWithAuth(<AuthForm type="register" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'securepass' } });
      // Missing username and confirm password
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(screen.getByText(/Username and confirm password are required for registration\./i)).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('displays error message on failed registration', async () => {
      mockRegister.mockResolvedValue(false);

      renderWithAuth(<AuthForm type="register" />, {
        providerProps: { login: mockLogin, register: mockRegister },
      });

      fireEvent.change(screen.getByLabelText(/Username:/i), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'new@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'securepass' } });
      fireEvent.change(screen.getByLabelText(/Confirm Password:/i), { target: { value: 'securepass' } });
      fireEvent.click(screen.getByRole('button', { name: /Register/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/An error occurred\. Please check the console for details\./i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });
});
```
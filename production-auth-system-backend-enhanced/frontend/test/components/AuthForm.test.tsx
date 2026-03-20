import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthForm from '../../src/components/AuthForm';

describe('AuthForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} loading={false} error={null} />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders register form correctly', () => {
    render(<AuthForm type="register" onSubmit={mockOnSubmit} loading={false} error={null} />);
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('displays error message', () => {
    const testError = 'Invalid credentials';
    render(<AuthForm type="login" onSubmit={mockOnSubmit} loading={false} error={testError} />);
    expect(screen.getByText(testError)).toBeInTheDocument();
  });

  it('disables input fields and button when loading', () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} loading={true} error={null} />);
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /processing.../i })).toBeDisabled();
  });

  it('calls onSubmit with correct values on form submission', async () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} loading={false} error={null} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows and hides forgot password section', async () => {
    render(
      <AuthForm
        type="login"
        onSubmit={mockOnSubmit}
        onForgotPassword={mockOnForgotPassword}
        loading={false}
        error={null}
      />
    );

    expect(screen.queryByRole('heading', { name: /reset password/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /forgot password?/i }));
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to login/i }));
    expect(screen.queryByRole('heading', { name: /reset password/i })).not.toBeInTheDocument();
  });

  it('calls onForgotPassword with correct email when submitted', async () => {
    render(
      <AuthForm
        type="login"
        onSubmit={mockOnSubmit}
        onForgotPassword={mockOnForgotPassword}
        loading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /forgot password?/i }));
    fireEvent.change(screen.getByLabelText(/email/i, { selector: '#forgotEmail' }), { target: { value: 'forgot@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockOnForgotPassword).toHaveBeenCalledWith('forgot@example.com');
    });
  });

  it('displays forgot password success message', async () => {
    mockOnForgotPassword.mockResolvedValueOnce(undefined); // Simulate successful API call

    render(
      <AuthForm
        type="login"
        onSubmit={mockOnSubmit}
        onForgotPassword={mockOnForgotPassword}
        loading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /forgot password?/i }));
    fireEvent.change(screen.getByLabelText(/email/i, { selector: '#forgotEmail' }), { target: { value: 'forgot@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/if an account with that email exists, a password reset link has been sent./i)).toBeInTheDocument();
    });
  });

  it('displays forgot password error message', async () => {
    mockOnForgotPassword.mockRejectedValueOnce({ response: { data: { message: 'User not found' } } });

    render(
      <AuthForm
        type="login"
        onSubmit={mockOnSubmit}
        onForgotPassword={mockOnForgotPassword}
        loading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /forgot password?/i }));
    fireEvent.change(screen.getByLabelText(/email/i, { selector: '#forgotEmail' }), { target: { value: 'forgot@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });
});
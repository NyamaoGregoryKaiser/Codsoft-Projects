```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthForm from './AuthForm';

describe('AuthForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders login form correctly', () => {
    render(
      <Router>
        <AuthForm type="login" onSubmit={mockOnSubmit} isLoading={false} error="" />
      </Router>
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  test('renders register form correctly', () => {
    render(
      <Router>
        <AuthForm type="register" onSubmit={mockOnSubmit} isLoading={false} error="" />
      </Router>
    );

    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  test('calls onSubmit with login data', () => {
    render(
      <Router>
        <AuthForm type="login" onSubmit={mockOnSubmit} isLoading={false} error="" />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  test('calls onSubmit with register data', () => {
    render(
      <Router>
        <AuthForm type="register" onSubmit={mockOnSubmit} isLoading={false} error="" />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
  });

  test('displays error message', () => {
    const errorMessage = 'Invalid credentials';
    render(
      <Router>
        <AuthForm type="login" onSubmit={mockOnSubmit} isLoading={false} error={errorMessage} />
      </Router>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('button is disabled when loading', () => {
    render(
      <Router>
        <AuthForm type="login" onSubmit={mockOnSubmit} isLoading={true} error="" />
      </Router>
    );

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });
});
```
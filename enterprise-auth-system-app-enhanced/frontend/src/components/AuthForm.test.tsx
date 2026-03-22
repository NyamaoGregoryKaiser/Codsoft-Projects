import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthForm from './AuthForm';
import { MemoryRouter } from 'react-router-dom';

describe('AuthForm', () => {
  it('renders login form by default', () => {
    render(<AuthForm type="login" onSubmit={vi.fn()} isLoading={false} />, { wrapper: MemoryRouter });
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/first name/i)).not.toBeInTheDocument();
  });

  it('renders register form when type is register', () => {
    render(<AuthForm type="register" onSubmit={vi.fn()} isLoading={false} />, { wrapper: MemoryRouter });
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('calls onSubmit with correct data for login', async () => {
    const handleSubmit = vi.fn();
    render(<AuthForm type="login" onSubmit={handleSubmit} isLoading={false} />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('calls onSubmit with correct data for register', async () => {
    const handleSubmit = vi.fn();
    render(<AuthForm type="register" onSubmit={handleSubmit} isLoading={false} />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'reg@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'regpassword' } });
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'reg@example.com',
      password: 'regpassword',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('shows loading state for button', () => {
    render(<AuthForm type="login" onSubmit={vi.fn()} isLoading={true} />, { wrapper: MemoryRouter });
    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeDisabled();
  });
});
```
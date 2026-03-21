```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthForm from '../components/AuthForm';

describe('AuthForm Component', () => {
  it('renders login form correctly', () => {
    render(<AuthForm type="login" onSubmit={() => {}} isLoading={false} />);
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/not a member\?/i)).toBeInTheDocument();
  });

  it('renders register form correctly', () => {
    render(<AuthForm type="register" onSubmit={() => {}} isLoading={false} />);
    expect(screen.getByRole('heading', { name: /register for an account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
  });

  it('calls onSubmit with correct values on login', async () => {
    const mockOnSubmit = jest.fn();
    render(<AuthForm type="login" onSubmit={mockOnSubmit} isLoading={false} />);

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(
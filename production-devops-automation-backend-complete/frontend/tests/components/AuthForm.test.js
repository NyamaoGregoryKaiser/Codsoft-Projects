```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import AuthForm from '../../src/components/AuthForm';

describe('AuthForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders login form correctly', () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument(); // Username not in login form
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('renders register form correctly', () => {
    render(<AuthForm type="register" onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('submits login form with correct data', () => {
    render(<AuthForm type="login" onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('submits register form with correct data', () => {
    render(<AuthForm type="register" onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'securepassword' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@example.com',
      password: 'securepassword',
    });
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Invalid credentials';
    render(<AuthForm type="login" onSubmit={mockOnSubmit} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('error-message');
  });
});
```
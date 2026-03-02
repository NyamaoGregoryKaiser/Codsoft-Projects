import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with default primary variant and medium size', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByText(/Click Me/i);
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-indigo-600'); // Default primary
    expect(button).toHaveClass('py-2 px-4');    // Default md size
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByText(/Cancel/i);
    expect(button).toHaveClass('bg-gray-200');
  });

  it('renders with danger variant and small size', () => {
    render(<Button variant="danger" size="sm">Delete</Button>);
    const button = screen.getByText(/Delete/i);
    expect(button).toHaveClass('bg-red-600');
    expect(button).toHaveClass('py-1 px-3');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByText(/Submit/i));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText(/Disabled Button/i);
    expect(button).toBeDisabled();
  });
});
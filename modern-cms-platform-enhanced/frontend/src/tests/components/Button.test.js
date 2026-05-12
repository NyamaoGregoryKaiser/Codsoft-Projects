```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/Button';
import '@testing-library/jest-dom';

describe('Button Component', () => {
  test('renders with default props', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-primary'); // Default variant
    expect(buttonElement).not.toBeDisabled();
  });

  test('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /secondary button/i });
    expect(buttonElement).toHaveClass('bg-gray-200');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /test button/i });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /disabled button/i });
    expect(buttonElement).toBeDisabled();
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('shows spinner when loading prop is true', () => {
    render(<Button loading>Loading Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /loading button/i });
    expect(buttonElement).toBeDisabled(); // Button should be disabled when loading
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Spinner is usually an SVG or has role img
  });

  test('applies custom className', () => {
    render(<Button className="custom-style">Custom Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /custom button/i });
    expect(buttonElement).toHaveClass('custom-style');
  });

  test('button type defaults to button', () => {
    render(<Button>Default Type</Button>);
    const buttonElement = screen.getByRole('button', { name: /default type/i });
    expect(buttonElement).toHaveAttribute('type', 'button');
  });

  test('button type can be overridden to submit', () => {
    render(<Button type="submit">Submit Type</Button>);
    const buttonElement = screen.getByRole('button', { name: /submit type/i });
    expect(buttonElement).toHaveAttribute('type', 'submit');
  });
});
```
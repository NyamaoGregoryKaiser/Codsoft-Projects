```typescript
// frontend/src/components/ui/Button.spec.tsx (Example of Frontend Unit Test)
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button'; // Assuming Button component is in this path

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByText('Click Me');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-indigo-600'); // Default variant
    expect(button).toHaveClass('py-2'); // Default size
  });

  it('renders with a custom variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByText('Secondary Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-gray-200'); // Secondary variant
  });

  it('renders with a custom size', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByText('Large Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('py-3'); // Large size
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test Click</Button>);
    const button = screen.getByText('Test Click');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders children correctly', () => {
    render(<Button><span>Icon</span> Submit</Button>);
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    const button = screen.getByText('Custom Class');
    expect(button).toHaveClass('custom-class');
  });
});
```
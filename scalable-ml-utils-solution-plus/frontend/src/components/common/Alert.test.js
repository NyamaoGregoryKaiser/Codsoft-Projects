```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from './Alert';

describe('Alert Component', () => {
  test('does not render if message is null or empty', () => {
    const { container } = render(<Alert message={null} />);
    expect(container.firstChild).toBeNull();

    render(<Alert message="" />);
    expect(container.firstChild).toBeNull();
  });

  test('renders with the correct message and default type (info)', () => {
    const message = 'This is an info alert.';
    render(<Alert message={message} />);
    const alertElement = screen.getByText(message);
    expect(alertElement).toBeInTheDocument();
    expect(alertElement.closest('.alert')).toHaveClass('alert-info');
  });

  test('renders with the specified type', () => {
    const message = 'This is an error alert.';
    render(<Alert message={message} type="error" />);
    const alertElement = screen.getByText(message);
    expect(alertElement.closest('.alert')).toHaveClass('alert-error');
  });

  test('renders a close button if onClose prop is provided', () => {
    const handleClose = jest.fn();
    render(<Alert message="Test message" onClose={handleClose} />);
    const closeButton = screen.getByRole('button', { name: /close/i }); // Matches the &times; char
    expect(closeButton).toBeInTheDocument();
  });

  test('calls onClose handler when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Alert message="Test message" onClose={handleClose} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
```
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnTyping = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Enable fake timers for debounce/throttle logic
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // Clear any pending timers
    jest.useRealTimers(); // Restore real timers
  });

  it('renders the input field and send button', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello chat' } });
    expect(input.value).toBe('Hello chat');
  });

  it('calls onSendMessage with content when send button is clicked', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    expect((input as HTMLInputElement).value).toBe(''); // Input should clear
  });

  it('calls onSendMessage with content when Enter key is pressed', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'Another test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Another test message');
    expect((input as HTMLInputElement).value).toBe(''); // Input should clear
  });

  it('does not call onSendMessage if input is empty', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.click(sendButton);
    expect(mockOnSendMessage).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('calls onTyping(true) when user starts typing and onTyping(false) after a timeout', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'a' } });
    expect(mockOnTyping).toHaveBeenCalledWith(true);
    expect(mockOnTyping).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000); // Advance less than 1.5s
    fireEvent.change(input, { target: { value: 'ab' } });
    // onTyping(true) should not be called again immediately if already true
    expect(mockOnTyping).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1500); // Advance past the timeout
    expect(mockOnTyping).toHaveBeenCalledWith(false);
    expect(mockOnTyping).toHaveBeenCalledTimes(2); // (true) then (false)
  });

  it('calls onTyping(false) immediately after sending a message', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} onTyping={mockOnTyping} />);
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.change(input, { target: { value: 'Message' } });
    expect(mockOnTyping).toHaveBeenCalledWith(true);

    fireEvent.click(sendButton);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Message');
    expect(mockOnTyping).toHaveBeenCalledWith(false); // Should be called after send
    expect(mockOnTyping).toHaveBeenCalledTimes(2); // (true) then (false)
  });
});
```
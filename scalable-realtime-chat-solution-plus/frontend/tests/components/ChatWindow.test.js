```javascript
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatWindow from '../../src/components/ChatWindow';

describe('ChatWindow', () => {
    const currentUser = { id: 'user1', username: 'Alice' };

    it('renders "No messages yet" when message list is empty', () => {
        render(<ChatWindow messages={[]} currentUser={currentUser} />);
        expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    });

    it('renders sent messages correctly', () => {
        const messages = [
            { id: 'm1', content: 'Hi there!', senderId: 'user1', sender: { username: 'Alice' }, createdAt: '2023-01-01T10:00:00Z' },
        ];
        render(<ChatWindow messages={messages} currentUser={currentUser} />);
        const messageElement = screen.getByText('Hi there!').closest('.chat-message');
        expect(messageElement).toHaveClass('sent');
        expect(screen.queryByText('Alice')).not.toBeInTheDocument(); // Sender username hidden for sent
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('renders received messages correctly', () => {
        const messages = [
            { id: 'm2', content: 'Hello!', senderId: 'user2', sender: { username: 'Bob' }, createdAt: '2023-01-01T10:01:00Z' },
        ];
        render(<ChatWindow messages={messages} currentUser={currentUser} />);
        const messageElement = screen.getByText('Hello!').closest('.chat-message');
        expect(messageElement).toHaveClass('received');
        expect(screen.getByText('Bob')).toBeInTheDocument(); // Sender username visible for received
        expect(screen.getByText('10:01 AM')).toBeInTheDocument();
    });

    it('renders multiple messages in correct order', () => {
        const messages = [
            { id: 'm1', content: 'First message', senderId: 'user1', sender: { username: 'Alice' }, createdAt: '2023-01-01T10:00:00Z' },
            { id: 'm2', content: 'Second message', senderId: 'user2', sender: { username: 'Bob' }, createdAt: '2023-01-01T10:01:00Z' },
            { id: 'm3', content: 'Third message', senderId: 'user1', sender: { username: 'Alice' }, createdAt: '2023-01-01T10:02:00Z' },
        ];
        render(<ChatWindow messages={messages} currentUser={currentUser} />);

        const renderedMessages = screen.getAllByRole('article'); // Assuming chat-message div has role 'article'
        expect(renderedMessages.length).toBe(3);
        expect(renderedMessages[0]).toHaveTextContent('First message');
        expect(renderedMessages[1]).toHaveTextContent('Second message');
        expect(renderedMessages[2]).toHaveTextContent('Third message');

        // Check classes for sent/received
        expect(screen.getByText('First message').closest('.chat-message')).toHaveClass('sent');
        expect(screen.getByText('Second message').closest('.chat-message')).toHaveClass('received');
        expect(screen.getByText('Third message').closest('.chat-message')).toHaveClass('sent');
    });
});
```
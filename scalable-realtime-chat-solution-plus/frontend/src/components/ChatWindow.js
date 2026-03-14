```javascript
/**
 * @file Displays messages in the selected chat room.
 * @module components/ChatWindow
 */

import React, { useRef, useEffect } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ messages, currentUser }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!messages || messages.length === 0) {
        return (
            <div className="chat-window">
                <p className="no-messages">No messages yet. Start the conversation!</p>
            </div>
        );
    }

    return (
        <div className="chat-window">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`chat-message ${message.senderId === currentUser.id ? 'sent' : 'received'}`}
                >
                    <div className="message-header">
                        <span className="sender-username">
                            {message.sender ? message.sender.username : 'Unknown'}
                        </span>
                        <span className="message-timestamp">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatWindow;
```
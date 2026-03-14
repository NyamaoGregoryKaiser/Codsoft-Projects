```javascript
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import '../assets/App.css'; // For styling

const MessageItem = ({ message }) => {
  const { user } = useAuth();
  const isOwnMessage = user?._id === message.sender?._id;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., 10:30 AM
  };

  return (
    <div className={`message-item ${isOwnMessage ? 'own' : ''}`}>
      <div className="message-bubble">
        {!isOwnMessage && (
          <span className="message-meta" style={{ fontWeight: 'bold', color: '#007bff' }}>
            {message.sender?.username || 'Unknown User'}
          </span>
        )}
        <p>{message.content}</p>
        <span className="message-meta">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
```
import React, { useState } from 'react';
import '../../styles/MessageInput.css'; // Assume a separate CSS for MessageInput

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="message-input-field"
        autoFocus
      />
      <button type="submit" className="message-send-button">Send</button>
    </form>
  );
};

export default MessageInput;
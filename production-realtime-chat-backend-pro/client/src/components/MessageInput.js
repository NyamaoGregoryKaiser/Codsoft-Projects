```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import '../assets/App.css'; // For styling

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const { socket } = useSocket();
  const { user } = useAuth();
  const { typingUsers } = useChat(); // Access typing users from ChatContext
  const textareaRef = useRef(null);

  const TYPING_TIMEOUT = 3000; // 3 seconds
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    // Adjust textarea height dynamically
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = textarea.scrollHeight + 'px'; // Set to scroll height
    }
  }, [message]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket && roomId && user) {
      socket.emit('sendMessage', { roomId, content: message.trim() });
      setMessage('');
      stopTyping(); // Ensure stop typing is sent after message
    }
  };

  const startTyping = () => {
    if (socket && roomId && !isTypingRef.current) {
      socket.emit('typing', { roomId });
      isTypingRef.current = true;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, TYPING_TIMEOUT);
  };

  const stopTyping = () => {
    if (socket && roomId && isTypingRef.current) {
      socket.emit('stopTyping', { roomId });
      isTypingRef.current = false;
    }
    clearTimeout(typingTimerRef.current);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    startTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSendMessage(e);
    }
  };

  const currentRoomTypingUsers = typingUsers[roomId]?.filter(u => u.userId !== user?._id);
  const typingMessage = currentRoomTypingUsers && currentRoomTypingUsers.length > 0
    ? `${currentRoomTypingUsers.map(u => u.username).join(', ')} is typing...`
    : '';

  return (
    <>
      {typingMessage && <div className="typing-indicator">{typingMessage}</div>}
      <form onSubmit={handleSendMessage} className="message-input-container">
        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping} // Stop typing if textarea loses focus
          placeholder="Type a message..."
          rows={1}
        />
        <button type="submit" className="send-button" disabled={!message.trim()}>
          Send
        </button>
      </form>
    </>
  );
};

export default MessageInput;
```
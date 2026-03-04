```typescript
import React, { useState, KeyboardEvent } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping }) => {
  const [content, setContent] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    
    if (!typingTimeout) {
      onTyping(true); // User started typing
    }
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a new timeout to send 'stopped typing' after a delay
    setTypingTimeout(
      setTimeout(() => {
        onTyping(false);
        setTypingTimeout(null);
      }, 1500) // 1.5 seconds
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content.trim());
      setContent('');
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      onTyping(false); // Ensure typing status is reset after sending
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Allow shift+enter for multi-line if it was a textarea
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <input
        type="text"
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="message-input-field"
      />
      <button type="submit" className="message-send-button">Send</button>
    </form>
  );
};

export default MessageInput;
```
import React, { useState, KeyboardEvent, ChangeEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingEnd: () => void; // Optional, timeout usually handles it
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTypingStart, onTypingEnd }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (!isTyping) {
      onTypingStart();
      setIsTyping(true);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingEnd(); // Notify typing has stopped
    }, 2000); // Consider user stopped typing after 2 seconds of no input
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      onTypingEnd(); // Ensure typing end is sent if message is sent
    }
  };

  return (
    <div className="flex items-center rounded-lg bg-gray-700 p-2">
      <textarea
        className="flex-1 resize-none overflow-hidden rounded-lg border-none bg-transparent p-2 text-white focus:ring-0"
        placeholder="Type a message..."
        rows={1}
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={onTypingStart} // Start typing when focus enters
        onBlur={onTypingEnd} // End typing when focus leaves
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="ml-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
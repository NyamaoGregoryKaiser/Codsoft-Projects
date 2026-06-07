```typescript
import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isDisabled = false }) => {
  const [message, setMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <input
        type="text"
        className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition duration-150 ease-in-out"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isDisabled}
      />
      <button
        type="submit"
        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 transition duration-150 ease-in-out"
        disabled={isDisabled || !message.trim()}
        aria-label="Send message"
      >
        <PaperAirplaneIcon className="h-6 w-6 transform rotate-45 -mt-1 -mr-1" />
      </button>
    </form>
  );
};

export default MessageInput;
```
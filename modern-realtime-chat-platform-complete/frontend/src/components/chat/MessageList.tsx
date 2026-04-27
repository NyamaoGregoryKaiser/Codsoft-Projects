import React, { useRef, useEffect } from 'react';
import { Message, User } from '../../types';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, onLoadMore, hasMore, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on initial load and when new messages arrive from current user
  useEffect(() => {
    if (messagesEndRef.current && scrollContainerRef.current) {
      // Only scroll to bottom if it's the first load or if the user is near the bottom
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold

      if (messages.length > 0 && isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } else if (messages.length === 0) { // On initial empty load of a room
        messagesEndRef.current.scrollIntoView();
      }
    }
  }, [messages]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop } = scrollContainerRef.current;
      if (scrollTop === 0 && hasMore && !isLoading) {
        onLoadMore(); // Load more messages when scrolled to the top
      }
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex flex-1 flex-col-reverse overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
      onScroll={handleScroll}
    >
      <div ref={messagesEndRef} /> {/* For auto-scrolling to bottom */}

      {isLoading && <p className="text-center text-gray-400">Loading older messages...</p>}
      {!hasMore && !isLoading && messages.length > 0 && (
        <p className="text-center text-gray-400">No older messages</p>
      )}
      {messages.length === 0 && !isLoading && (
        <p className="text-center text-gray-400">Be the first to send a message!</p>
      )}

      {[...messages].reverse().map((message) => { // Reverse again for display order (oldest at top of visible area)
        const isMyMessage = message.sender.id === currentUser.id;
        const messageDate = new Date(message.timestamp);

        return (
          <div
            key={message.id}
            className={`mb-4 flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
          >
            {!isMyMessage && message.sender.id !== 'system' && (
              <img
                src={message.sender.avatar || '/images/default-avatar.png'} // Placeholder for avatar
                alt={message.sender.username}
                className="mr-2 h-8 w-8 rounded-full"
              />
            )}
            <div
              className={`max-w-xs rounded-xl p-3 ${
                isMyMessage
                  ? 'rounded-br-none bg-indigo-600'
                  : message.sender.id === 'system'
                    ? 'rounded-xl bg-gray-600 italic text-gray-300'
                    : 'rounded-bl-none bg-gray-700'
              }`}
            >
              {message.sender.id !== 'system' && !isMyMessage && (
                <p className="mb-1 text-sm font-semibold text-indigo-300">
                  {message.sender.username}
                </p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className="mt-1 text-right text-xs text-gray-400">
                {format(messageDate, 'HH:mm')}
              </p>
            </div>
            {isMyMessage && (
              <img
                src={currentUser.avatar || '/images/default-avatar.png'}
                alt={currentUser.username}
                className="ml-2 h-8 w-8 rounded-full"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
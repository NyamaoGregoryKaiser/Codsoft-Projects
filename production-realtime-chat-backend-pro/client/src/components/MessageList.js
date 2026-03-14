```javascript
import React, { useEffect, useRef, useCallback } from 'react';
import MessageItem from './MessageItem';
import { useChat } from '../hooks/useChat';
import '../assets/App.css'; // For styling

const MessageList = ({ roomId }) => {
  const { messages, loadingMessages, fetchMessages, hasMoreMessages } = useChat();
  const listRef = useRef(null);
  const isScrollingRef = useRef(false);

  const currentRoomMessages = messages[roomId] || [];

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      // Detect if user scrolled near the top
      if (scrollTop < 50 && hasMoreMessages[roomId] && !loadingMessages) {
        // Load older messages
        if (!isScrollingRef.current) {
          isScrollingRef.current = true; // Prevent multiple calls
          fetchMessages(roomId);
        }
      } else if (scrollTop > 100) {
        isScrollingRef.current = false; // Reset if scrolled down
      }
    }
  }, [roomId, hasMoreMessages, loadingMessages, fetchMessages]);

  useEffect(() => {
    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => {
        listElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Scroll to bottom on initial load and new messages if near bottom
  useEffect(() => {
    const listElement = listRef.current;
    if (listElement && currentRoomMessages.length > 0) {
      const scrollThreshold = 100; // If within 100px of bottom, auto-scroll
      const isNearBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight < scrollThreshold;

      if (isNearBottom || currentRoomMessages.length === 1) { // Auto-scroll for initial message or if already near bottom
        listElement.scrollTop = listElement.scrollHeight;
      }
    }
  }, [currentRoomMessages]);

  return (
    <div className="message-list-container" ref={listRef}>
      {loadingMessages && <div style={{ textAlign: 'center', padding: '10px' }}>Loading older messages...</div>}
      {currentRoomMessages.length === 0 && !loadingMessages && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No messages yet. Start the conversation!</div>
      )}
      {[...currentRoomMessages].reverse().map((message) => ( // Reverse to display newest at bottom visually
        <MessageItem key={message._id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
```
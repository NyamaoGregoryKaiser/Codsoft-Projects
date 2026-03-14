```javascript
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import API from '../api/api'; // For REST calls
import { debounce } from '../utils/helpers'; // Utility for debouncing

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket, loading: socketLoading } = useContext(SocketContext);
  const { user, isAuthenticated } = useContext(AuthContext);

  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState({}); // { roomId: [message1, message2, ...] }
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: username }
  const [typingUsers, setTypingUsers] = useState({}); // { roomId: [{ userId, username }] }
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState({}); // { roomId: boolean }
  const [messagePages, setMessagePages] = useState({}); // { roomId: pageNumber }

  // Typing debounce map for local state management (to remove self from typing after a delay)
  const selfTypingTimers = useRef({});

  const fetchRooms = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoadingRooms(false);
      return;
    }
    try {
      const res = await API.get('/rooms');
      setRooms(res.data.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      // Handle error, e.g., show notification
    } finally {
      setLoadingRooms(false);
    }
  }, [isAuthenticated, user]);

  const fetchMessages = useCallback(async (roomId) => {
    if (!roomId || loadingMessages) return;

    setLoadingMessages(true);
    const currentPage = messagePages[roomId] || 0; // page number is 0-indexed for internal tracking
    const nextPage = currentPage + 1;

    try {
      const res = await API.get(`/messages/${roomId}?page=${nextPage}&limit=50`);
      const newMessages = res.data.data;

      setMessages(prev => ({
        ...prev,
        [roomId]: newMessages.reverse().concat(prev[roomId] || []) // New messages are oldest, append to existing
      }));
      setHasMoreMessages(prev => ({ ...prev, [roomId]: newMessages.length === 50 }));
      setMessagePages(prev => ({ ...prev, [roomId]: nextPage }));
    } catch (err) {
      console.error(`Error fetching messages for room ${roomId}:`, err);
    } finally {
      setLoadingMessages(false);
    }
  }, [loadingMessages, messagePages]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRooms();
    } else {
      setRooms([]);
      setCurrentRoom(null);
      setMessages({});
      setOnlineUsers({});
      setTypingUsers({});
      setLoadingRooms(false);
    }
  }, [isAuthenticated, user, fetchRooms]);

  useEffect(() => {
    if (currentRoom) {
      // Reset messages, pages, and hasMore when room changes
      setMessages(prev => ({ ...prev, [currentRoom._id]: [] }));
      setMessagePages(prev => ({ ...prev, [currentRoom._id]: 0 }));
      setHasMoreMessages(prev => ({ ...prev, [currentRoom._id]: true }));
      fetchMessages(currentRoom._id);
    }
  }, [currentRoom, fetchMessages]);

  useEffect(() => {
    if (socket && isAuthenticated && user) {
      socket.on('receiveMessage', (newMessage) => {
        setMessages(prev => ({
          ...prev,
          [newMessage.room]: [...(prev[newMessage.room] || []), newMessage]
        }));
        // Remove typing indicator for sender in that room
        setTypingUsers(prev => {
          const roomTypingUsers = prev[newMessage.room]?.filter(
            (u) => u.userId !== newMessage.sender._id
          );
          return { ...prev, [newMessage.room]: roomTypingUsers || [] };
        });
      });

      socket.on('user:online', ({ userId, username }) => {
        setOnlineUsers(prev => ({ ...prev, [userId]: username }));
      });

      socket.on('user:offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      });

      socket.on('users:online:initial', (initialOnlineUsers) => {
        setOnlineUsers(initialOnlineUsers);
      });

      const updateTypingDebounced = debounce((roomId, userId, username) => {
        setTypingUsers(prev => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []).filter(u => u.userId !== userId), { userId, username }]
        }));
      }, 500); // Debounce to prevent rapid updates if multiple typing events are sent

      socket.on('typing', ({ roomId, userId, username }) => {
        if (userId === user._id) { // Don't show typing for self
          return;
        }
        updateTypingDebounced(roomId, userId, username);
      });

      socket.on('stopTyping', ({ roomId, userId }) => {
        setTypingUsers(prev => ({
          ...prev,
          [roomId]: (prev[roomId] || []).filter(u => u.userId !== userId)
        }));
      });

      socket.on('chat:error', (error) => {
        console.error('Chat error from server:', error);
        // Display user-friendly error message
        alert(`Chat Error: ${error.message || 'Something went wrong.'}`);
      });

      return () => {
        socket.off('receiveMessage');
        socket.off('user:online');
        socket.off('user:offline');
        socket.off('users:online:initial');
        socket.off('typing');
        socket.off('stopTyping');
        socket.off('chat:error');
      };
    }
  }, [socket, isAuthenticated, user]);

  const value = {
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    onlineUsers,
    typingUsers,
    loadingRooms,
    loadingMessages,
    hasMoreMessages,
    fetchMessages,
    fetchRooms // Allow re-fetching rooms if needed
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
```
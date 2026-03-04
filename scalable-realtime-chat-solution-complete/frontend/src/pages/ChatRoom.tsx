```typescript
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'api/axios';
import { Channel, Message, TypingStatus, User } from 'types';
import MessageItem from 'components/MessageItem';
import MessageInput from 'components/MessageInput';
import { useAuth } from 'auth/AuthContext';
import { useSocket } from 'hooks/useSocket';
import { useTypingStatus } from 'hooks/useTypingStatus';
import './ChatRoom.css';

const ChatRoom: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]); // Users currently in this chat room
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { typingUsers, handleTypingEvent, getTypingUsersForDisplay } = useTypingStatus();

  const handleReceiveMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const handleMessageUpdated = useCallback((updatedMessage: Message) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === updatedMessage.id ? updatedMessage : msg
      )
    );
  }, []);

  const handleMessageDeleted = useCallback((data: { messageId: string; channelId: string }) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== data.messageId)
    );
  }, []);

  const handleOnlineUsersInChannel = useCallback((data: { channelId: string; users: { id: string; username: string }[] }) => {
    if (data.channelId === channelId) {
      setOnlineUsers(data.users.map(u => ({ id: u.id, username: u.username, email: '' }))); // email is not sent in this payload
    }
  }, [channelId]);

  const handleUserJoinedChannel = useCallback((data: { userId: string; username: string; channelId: string }) => {
    if (data.channelId === channelId && currentUser?.id !== data.userId) {
      setOnlineUsers(prev => {
        if (!prev.some(u => u.id === data.userId)) {
          return [...prev, { id: data.userId, username: data.username, email: '' }];
        }
        return prev;
      });
      console.log(`${data.username} joined the channel.`);
    }
  }, [channelId, currentUser?.id]);

  const handleUserLeftChannel = useCallback((data: { userId: string; username: string; channelId: string }) => {
    if (data.channelId === channelId && currentUser?.id !== data.userId) {
      setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
      console.log(`${data.username} left the channel.`);
    }
  }, [channelId, currentUser?.id]);

  const handleChannelJoinError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => navigate('/dashboard'), 3000); // Redirect to dashboard after error
  }, [navigate]);

  const { emit } = useSocket(channelId || undefined, {
    onReceiveMessage: handleReceiveMessage,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
    onTyping: (status: TypingStatus) => {
      if (status.channelId === channelId) {
        handleTypingEvent(status);
      }
    },
    onOnlineUsersInChannel: handleOnlineUsersInChannel,
    onUserJoinedChannel: handleUserJoinedChannel,
    onUserLeftChannel: handleUserLeftChannel,
    onChannelJoinError: handleChannelJoinError,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!channelId) {
      setError('No channel ID provided.');
      setLoading(false);
      return;
    }

    const fetchChannelAndMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const [channelRes, messagesRes] = await Promise.all([
          axios.get(`/channels/${channelId}`),
          axios.get(`/messages/${channelId}`),
        ]);
        setChannel(channelRes.data);
        setMessages(messagesRes.data);
      } catch (err: any) {
        console.error('Failed to fetch channel or messages:', err);
        setError(err.response?.data?.message || 'Failed to load chat room.');
        // If 403 or 404, redirect to dashboard
        if (err.response?.status === 403 || err.response?.status === 404) {
          setTimeout(() => navigate('/dashboard'), 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchChannelAndMessages();
    }
  }, [channelId, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]); // Scroll when messages or typing status changes

  const handleSendMessage = async (content: string) => {
    if (!channelId || !content.trim()) return;

    try {
      // The message is sent via REST API, which then emits to socket.io
      await axios.post(`/messages/${channelId}`, { content });
      // The 'receiveMessage' socket event will update the state, no need to manually add here
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  const handleUpdateMessage = async (messageId: string, content: string) => {
    if (!channelId || !content.trim()) return;
    try {
      await axios.put(`/messages/${messageId}`, { content });
    } catch (err: any) {
      console.error('Failed to update message:', err);
      alert(err.response?.data?.message || 'Failed to update message.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!channelId || !window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`/messages/${messageId}`);
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      alert(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (channelId) {
      emit('typing', { channelId, isTyping });
    }
  };

  const typingUsersDisplay = getTypingUsersForDisplay(currentUser?.id);

  if (authLoading || loading) {
    return <div className="chatroom-container">Loading chat room...</div>;
  }

  if (error) {
    return (
      <div className="chatroom-container error-message">
        <p>{error}</p>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  if (!channel) {
    return <div className="chatroom-container error-message">Channel not found or accessible.</div>;
  }

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        <h2># {channel.name}</h2>
        <p>{channel.description}</p>
        <div className="online-users-display">
          Online: {onlineUsers.map(u => u.username).join(', ')}
        </div>
      </div>
      <div className="message-list">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onEdit={handleUpdateMessage}
            onDelete={handleDeleteMessage}
          />
        ))}
        {typingUsersDisplay.length > 0 && (
          <div className="typing-indicator">
            {typingUsersDisplay.join(', ')} {typingUsersDisplay.length > 1 ? 'are' : 'is'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
};

export default ChatRoom;
```
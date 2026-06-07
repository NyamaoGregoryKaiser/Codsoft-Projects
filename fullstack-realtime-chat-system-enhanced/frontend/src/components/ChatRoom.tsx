```typescript
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatRoom as ChatRoomType, Message } from '../types';
import { fetchChatRoomDetails, fetchChatMessages } from '../api/chat';
import MessageInput from './MessageInput';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon } from '@heroicons/react/24/outline';
import useWebSocket from '../hooks/useWebSocket';

interface ChatRoomProps {
  chatRoomId: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ chatRoomId }) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth(); // Get current user from AuthContext

  const API_WS_BASE_URL = process.env.REACT_APP_API_WS_BASE_URL || 'ws://localhost:8000/api/v1';
  const wsUrl = useMemo(() => `${API_WS_BASE_URL}/chats/${chatRoomId}/ws`, [chatRoomId, API_WS_BASE_URL]);

  const onMessageReceived = useCallback((newMessage: Message) => {
    setMessages((prevMessages) => {
      // Prevent duplicate messages if already present (e.g., from REST API fetch and WS)
      if (prevMessages.some(msg => msg.id === newMessage.id)) {
        return prevMessages;
      }
      return [...prevMessages, newMessage].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, []);

  const { sendMessage, isConnected, wsError } = useWebSocket(wsUrl, onMessageReceived);

  const loadChatRoomDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await fetchChatRoomDetails(chatRoomId);
      setChatRoom(details);
      // Messages are part of the detailed chat room, so load them here initially
      // const chatMessages = await fetchChatMessages(chatRoomId);
      setMessages(details.messages || []); // Use messages from details, or fetch if not sufficient
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load chat room details');
      console.error('Failed to load chat room details:', err);
    } finally {
      setLoading(false);
    }
  }, [chatRoomId]);

  useEffect(() => {
    if (chatRoomId) {
      loadChatRoomDetails();
    }
  }, [chatRoomId, loadChatRoomDetails]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (sendMessage) {
      sendMessage({ content: content });
    } else {
      console.error('WebSocket not connected. Cannot send message.');
      // Fallback to REST API if WS not connected, or show error to user
      // Example: sendChatMessage(chatRoomId, content);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-4 text-gray-500">
        Select a chat to start messaging.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-4 flex items-center">
        <UserIcon className="h-6 w-6 mr-2" />
        <h2 className="text-xl font-semibold">{chatRoom.name}</h2>
        <span className="ml-auto text-sm opacity-80">
          {chatRoom.members ? chatRoom.members.length : 0} members
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No messages yet. Be the first to say hello!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.sender.id === currentUser?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-md relative ${
                  message.sender.id === currentUser?.id
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm font-medium">
                  {message.sender.id === currentUser?.id ? 'You' : message.sender.username}
                </p>
                <p className="mt-1 text-base">{message.content}</p>
                <p className="mt-1 text-xs opacity-75 text-right">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-100">
        {wsError && <p className="text-red-500 text-sm mb-2">WebSocket Error: {wsError}</p>}
        {!isConnected && !wsError && <p className="text-yellow-600 text-sm mb-2">Connecting to chat...</p>}
        {isConnected && <p className="text-green-600 text-sm mb-2">Chat connected.</p>}
        <MessageInput onSendMessage={handleSendMessage} isDisabled={!isConnected} />
      </div>
    </div>
  );
};

export default ChatRoom;
```
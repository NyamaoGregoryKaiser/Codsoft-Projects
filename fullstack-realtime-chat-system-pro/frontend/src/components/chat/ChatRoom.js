import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axiosInstance';
import MessageInput from './MessageInput';
import MessageDisplay from './MessageDisplay';
import { useAuth } from '../../auth/AuthContext';
import useWebSocket from '../../hooks/useWebSocket';
import '../../styles/ChatRoom.css'; // Assume a separate CSS for ChatRoom

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Use current user info for message styling
  const [chatRoomInfo, setChatRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // WebSocket connection management and message receiving
  const { stompClient, isConnected } = useWebSocket();

  // Function to scroll to the bottom of the chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to fetch initial chat room data and messages
  useEffect(() => {
    const fetchChatRoomData = async () => {
      setLoading(true);
      try {
        const roomResponse = await axios.get(`/chatrooms/${roomId}`);
        setChatRoomInfo(roomResponse.data);

        const messagesResponse = await axios.get(`/messages/room/${roomId}`);
        setMessages(messagesResponse.data);
        setError('');
      } catch (err) {
        if (err.response?.status === 403) {
          setError('You are not authorized to view this chat room.');
          setTimeout(() => navigate('/'), 3000); // Redirect after 3 seconds
        } else if (err.response?.status === 404) {
          setError('Chat room not found.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setError('Failed to load chat room data.');
        }
        console.error('Error fetching chat room data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRoomData();
  }, [roomId, navigate]);

  // Effect to subscribe to WebSocket topic when connected and roomId is available
  useEffect(() => {
    if (isConnected && roomId && stompClient) {
      console.log(`Subscribing to /topic/chatroom.${roomId}.messages`);
      const subscription = stompClient.subscribe(`/topic/chatroom.${roomId}.messages`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        console.log('Received WebSocket message:', receivedMessage);
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      }, {
        // Optional: Send JWT token with subscription, though our WS config handles CONNECT frame
        // Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
      });

      return () => {
        console.log(`Unsubscribing from /topic/chatroom.${roomId}.messages`);
        subscription.unsubscribe();
      };
    }
  }, [isConnected, roomId, stompClient]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (messageContent) => {
    if (!stompClient || !isConnected) {
      setError('Not connected to chat service. Please refresh.');
      return;
    }
    if (!messageContent.trim()) return;

    const chatMessage = {
      chatRoomId: parseInt(roomId),
      content: messageContent,
    };

    try {
      console.log(`Sending message to /app/chat/${roomId}:`, chatMessage);
      stompClient.send(`/app/chat/${roomId}`, {}, JSON.stringify(chatMessage));
      setError(''); // Clear any previous error on successful send
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading chat room...</div>;
  }

  if (error) {
    return <div className="error-message chat-error">{error}</div>;
  }

  if (!chatRoomInfo) {
    return <div className="loading">Chat room data unavailable.</div>;
  }

  return (
    <div className="chat-room-container">
      <h2 className="chat-room-title">{chatRoomInfo.name}</h2>
      <p className="chat-room-description">{chatRoomInfo.description}</p>

      <div className="messages-area">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <MessageDisplay
              key={msg.id}
              message={msg}
              isOwnMessage={currentUser?.username === msg.sender?.username}
            />
          ))
        )}
        <div ref={messagesEndRef} /> {/* Scroll target */}
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatRoom;
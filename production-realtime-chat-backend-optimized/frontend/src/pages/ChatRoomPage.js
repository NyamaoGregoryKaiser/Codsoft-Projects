```javascript
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/apiClient';
import moment from 'moment';
import './ChatRoomPage.css';

const ChatRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user: currentUser } = useAuth(); // Logged-in user
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]); // Users currently in the socket room
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !newMessage.trim()) return;

    socket.emit('sendMessage', { roomId, content: newMessage.trim() }, (response) => {
      if (response.status === 'ok') {
        setNewMessage('');
      } else {
        setError(response.message);
        console.error('Failed to send message:', response.message);
      }
    });
  };

  const handleLeaveRoom = useCallback(async () => {
    if (socket) {
      socket.emit('leaveRoom', roomId, (response) => {
        if (response.status === 'ok') {
          console.log('Successfully left socket room.');
          navigate('/dashboard');
        } else {
          console.error('Failed to leave socket room:', response.message);
        }
      });
    } else {
      navigate('/dashboard'); // If socket not connected, just navigate away
    }
  }, [socket, roomId, navigate]);

  useEffect(() => {
    // Attempt to join the room via Socket.IO
    if (socket && currentUser && roomId) {
      console.log('Attempting to join socket room:', roomId);
      socket.emit('joinRoom', roomId, (response) => {
        if (response.status === 'ok') {
          console.log('Joined socket room:', response.room.name);
          setRoom(response.room);
          setMessages(response.messages);
          setLoading(false);
          setError('');
        } else {
          setError(response.message);
          setLoading(false);
          console.error('Failed to join socket room:', response.message);
          // If joining fails, likely due to authorization, redirect to dashboard
          if (response.message.includes('Access to private room denied')) {
            setTimeout(() => navigate('/dashboard'), 3000); // Redirect after a delay
          }
        }
      });

      // Socket event listeners
      socket.on('message', (message) => {
        console.log('Received message:', message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      socket.on('userJoined', ({ userId, username, roomId: joinedRoomId }) => {
        if (joinedRoomId === roomId) {
          console.log(`${username} joined the room.`);
        }
      });

      socket.on('userLeft', ({ userId, username, roomId: leftRoomId }) => {
        if (leftRoomId === roomId) {
          console.log(`${username} left the room.`);
        }
      });

      socket.on('roomUsers', (users) => {
        console.log('Room users updated:', users);
        setRoomUsers(users);
      });

      // Cleanup on component unmount or room change
      return () => {
        console.log('Cleaning up socket listeners for room:', roomId);
        socket.off('message');
        socket.off('userJoined');
        socket.off('userLeft');
        socket.off('roomUsers');
        // Do not call handleLeaveRoom here as it might navigate before component fully unmounts
        // Or cause issues if socket already disconnected.
        // It's better to explicitly leave via button or rely on socket disconnect handling.
      };
    } else if (!socket && !loading) {
      // If socket is not available after auth is loaded, and not currently loading, something is wrong.
      // This could happen if initial socket connection failed or user navigated directly.
      // Try to re-establish connection or redirect.
      console.log("Socket not available, redirecting to dashboard.");
      navigate('/dashboard');
    }
  }, [socket, roomId, currentUser, loading, navigate]); // Depend on socket, room, current user, and loading state

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return <div className="chat-loading">Loading chat room...</div>;
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  if (!room) {
    return <div className="chat-error">Room data not found.</div>;
  }

  return (
    <div className="chat-room-page">
      <div className="room-header">
        <h2>{room.name} {room.isPrivate && <span className="private-tag">(Private)</span>}</h2>
        <button onClick={handleLeaveRoom} className="leave-room-btn">Leave Room</button>
      </div>

      <div className="chat-layout">
        <div className="chat-users">
          <h3>Users in Room ({roomUsers.length})</h3>
          <ul>
            {roomUsers.map((userInRoom) => (
              <li key={userInRoom.userId}>
                {userInRoom.username} {userInRoom.userId === currentUser.id && '(You)'}
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-item ${msg.sender.id === currentUser.id ? 'my-message' : ''}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {msg.sender.username} {msg.sender.id === currentUser.id && '(You)'}
                  </span>
                  <span className="message-time">
                    {moment(msg.createdAt).format('h:mm A')}
                  </span>
                </div>
                <p className="message-content">{msg.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-input-form">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows="3"
            />
            <button type="submit" disabled={!socket || !newMessage.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage;
```
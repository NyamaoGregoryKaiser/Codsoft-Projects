import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/ChatList.css'; // Assume a separate CSS for ChatList

const ChatList = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // To potentially show creator info or user-specific logic

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/chatrooms/my-rooms');
      setChatRooms(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch chat rooms. Please try again.');
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setError('Chat room name cannot be empty.');
      return;
    }
    setError('');
    try {
      const response = await axios.post('/chatrooms', {
        name: newRoomName,
        description: newRoomDescription,
      });
      // Optionally add the new room to the list immediately or refetch
      // For now, let's refetch to ensure consistent state
      setNewRoomName('');
      setNewRoomDescription('');
      fetchChatRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chat room.');
      console.error('Error creating chat room:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading chat rooms...</div>;
  }

  return (
    <div className="chat-list-container">
      <h2>Your Chat Rooms</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="create-room-form">
        <h3>Create New Chat Room</h3>
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label htmlFor="roomName">Room Name:</label>
            <input
              type="text"
              id="roomName"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              required
              maxLength="50"
            />
          </div>
          <div className="form-group">
            <label htmlFor="roomDescription">Description (Optional):</label>
            <input
              type="text"
              id="roomDescription"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              maxLength="255"
            />
          </div>
          <button type="submit" className="create-room-btn">Create Room</button>
        </form>
      </div>

      {chatRooms.length === 0 ? (
        <p>You haven't joined any chat rooms yet. Create one above!</p>
      ) : (
        <ul className="chat-rooms-list">
          {chatRooms.map((room) => (
            <li key={room.id} className="chat-room-item">
              <Link to={`/chat/${room.id}`}>
                <h4>{room.name}</h4>
                <p>{room.description || 'No description'}</p>
                <small>Creator: {room.creator?.username}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList;
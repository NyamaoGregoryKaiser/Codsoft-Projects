```javascript
import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await apiClient.get('/chat');
        setChatRooms(response.data); // Backend sends { data: chatRooms[] }
      } catch (err) {
        setError(err.message || 'Failed to fetch chat rooms.');
        console.error('Error fetching chat rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setError('Room name cannot be empty.');
      return;
    }
    setError('');
    try {
      const response = await apiClient.post('/chat', {
        name: newRoomName,
        description: newRoomDescription,
        isPrivate: newRoomIsPrivate,
      });
      setChatRooms([...chatRooms, response.data]); // Add new room to list
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomIsPrivate(false);
    } catch (err) {
      setError(err.message || 'Failed to create chat room.');
      console.error('Error creating chat room:', err);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await apiClient.post(`/chat/${roomId}/join`);
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.message || 'Failed to join chat room.');
      console.error('Error joining chat room:', err);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading chat rooms...</div>;
  }

  return (
    <div className="dashboard-page">
      <h2>Welcome, {user?.username}!</h2>

      <div className="create-room-section container">
        <h3>Create New Chat Room</h3>
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label htmlFor="roomName">Room Name</label>
            <input
              type="text"
              id="roomName"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="roomDescription">Description (optional)</label>
            <input
              type="text"
              id="roomDescription"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
            />
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="isPrivate"
              checked={newRoomIsPrivate}
              onChange={(e) => setNewRoomIsPrivate(e.target.checked)}
            />
            <label htmlFor="isPrivate">Private Room?</label>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Create Room</button>
        </form>
      </div>

      <div className="chat-rooms-list container">
        <h3>Available Chat Rooms</h3>
        {chatRooms.length === 0 ? (
          <p>No chat rooms available. Create one!</p>
        ) : (
          <ul>
            {chatRooms.map((room) => (
              <li key={room.id} className="chat-room-item">
                <div className="room-info">
                  <h4>{room.name} {room.isPrivate && <span className="private-tag">(Private)</span>}</h4>
                  <p>{room.description || 'No description.'}</p>
                  <div className="room-users-count">
                    Members: {room.users ? room.users.length : 0}
                  </div>
                </div>
                <div className="room-actions">
                  <button onClick={() => handleJoinRoom(room.id)}>Join Chat</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
```
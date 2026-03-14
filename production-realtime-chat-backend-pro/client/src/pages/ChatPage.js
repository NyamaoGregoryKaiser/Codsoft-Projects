```javascript
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import RoomList from '../components/RoomList';
import UserList from '../components/UserList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import '../assets/App.css'; // For styling

const ChatPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { socket, loading: socketLoading } = useSocket();
  const {
    rooms,
    currentRoom,
    setCurrentRoom,
    onlineUsers,
    loadingRooms,
  } = useChat();

  useEffect(() => {
    if (!authLoading && user && rooms.length > 0 && !currentRoom) {
      // Set the first room as current if no room is selected
      setCurrentRoom(rooms[0]);
    }
  }, [authLoading, user, rooms, currentRoom, setCurrentRoom]);

  const handleSelectRoom = (room) => {
    if (currentRoom && currentRoom._id === room._id) return; // Already in this room

    // Leave previous room on socket if applicable (not strictly necessary with our current socket handler,
    // as rooms are joined based on user's db rooms, but good practice for dynamic joins/leaves)
    if (currentRoom && socket) {
      socket.emit('leaveRoom', currentRoom._id);
    }
    
    setCurrentRoom(room);
    if (socket) {
      socket.emit('joinRoom', room._id);
    }
  };

  if (authLoading || socketLoading || loadingRooms || !user) {
    return (
      <div className="chat-page-loading">
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="sidebar">
        <RoomList rooms={rooms} currentRoom={currentRoom} onSelectRoom={handleSelectRoom} />
        <UserList onlineUsers={onlineUsers} currentUser={user} />
      </div>
      <div className="chat-main">
        {currentRoom ? (
          <>
            <div className="chat-header">
              {currentRoom.name}
            </div>
            <MessageList roomId={currentRoom._id} />
            <MessageInput roomId={currentRoom._id} />
          </>
        ) : (
          <div className="chat-welcome">
            <h3>Welcome to Realtime Chat!</h3>
            <p>Select a room from the left sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
```
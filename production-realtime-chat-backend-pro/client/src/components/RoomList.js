```javascript
import React from 'react';
import '../assets/App.css'; // For styling

const RoomList = ({ rooms, currentRoom, onSelectRoom }) => {
  return (
    <div className="room-list-container">
      <h3>Rooms</h3>
      <ul className="room-list">
        {rooms.length === 0 ? (
          <li style={{ color: '#ccc', fontStyle: 'italic' }}>No rooms joined.</li>
        ) : (
          rooms.map((room) => (
            <li
              key={room._id}
              className={`room-list-item ${currentRoom?._id === room._id ? 'active' : ''}`}
              onClick={() => onSelectRoom(room)}
            >
              # {room.name} {room.isPrivate && '(Private)'}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RoomList;
```
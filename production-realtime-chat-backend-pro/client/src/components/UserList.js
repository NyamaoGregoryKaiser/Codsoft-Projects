```javascript
import React from 'react';
import '../assets/App.css'; // For styling

const UserList = ({ onlineUsers, currentUser }) => {
  const onlineUsersArray = Object.entries(onlineUsers)
    .map(([userId, username]) => ({ _id: userId, username }));

  return (
    <div className="user-list-container">
      <h3>Online Users</h3>
      <ul className="user-list">
        {onlineUsersArray.length === 0 ? (
          <li style={{ color: '#ccc', fontStyle: 'italic' }}>No users online.</li>
        ) : (
          onlineUsersArray.map((user) => (
            <li
              key={user._id}
              className={`user-list-item ${currentUser?._id === user._id ? 'active' : ''}`}
            >
              <span className="user-status-indicator online"></span>
              {user.username} {currentUser?._id === user._id && '(You)'}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default UserList;
```
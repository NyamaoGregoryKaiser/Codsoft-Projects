```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import '../assets/App.css'; // Assuming common styles

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { disconnectSocket } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket(); // Disconnect socket on logout
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Realtime Chat
      </Link>
      <div className="navbar-nav">
        {isAuthenticated ? (
          <>
            <span className="nav-link nav-user">Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '1rem' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
```
```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import './Navbar.css'; // For basic styling

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Realtime Chat
      </Link>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <span className="navbar-welcome">Welcome, {user?.username}!</span>
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <Link to="/profile" className="navbar-link">Profile</Link>
            <button onClick={handleLogout} className="navbar-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/auth" className="navbar-link">Login / Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
```
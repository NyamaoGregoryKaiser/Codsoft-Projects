```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="header-title">
          Performance Monitor
        </Link>
      </div>
      <nav className="header-right">
        {isAuthenticated ? (
          <>
            <span className="header-welcome">Welcome, {user?.username || 'User'}!</span>
            <Link to="/dashboard" className="header-link">Dashboard</Link>
            {/* <Link to="/profile" className="header-link">Profile</Link> */}
            <button onClick={handleLogout} className="header-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="header-link">Login</Link>
            <Link to="/register" className="header-button">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
```
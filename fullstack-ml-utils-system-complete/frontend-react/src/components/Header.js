import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/main.css'; // Assuming main.css for general styles

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/" className="brand-link">
          ML Utilities
        </Link>
      </div>
      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-item">
              Dashboard
            </Link>
            <Link to="/models" className="nav-item">
              Models
            </Link>
            {user && user.role === 'admin' && (
                <Link to="/admin" className="nav-item">Admin</Link> // Example admin link
            )}
            <span className="nav-user-info">Welcome, {user?.email || 'User'}</span>
            <button onClick={handleLogout} className="nav-button logout-button">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-button login-button">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
```
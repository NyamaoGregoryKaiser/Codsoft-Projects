import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="container">
        <Link to="/" className="logo">
          ML Utilities
        </Link>
        <nav className="main-nav">
          <Link to="/">Models</Link>
          {/* Add more navigation links as your app grows */}
        </nav>
        <div className="auth-section">
          {isAuthenticated ? (
            <>
              <span className="welcome-message">Welcome, {username}</span>
              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
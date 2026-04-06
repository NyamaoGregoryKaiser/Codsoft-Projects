import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.svg'; // Assuming you have a logo

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/dashboard" className="logo-link">
          <img src={logo} alt="DB Health Monitor Logo" className="app-logo" />
          <h1>DB Health Monitor</h1>
        </Link>
      </div>
      <nav className="header-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/databases">Databases</Link>
        {/* <Link to="/settings">Settings</Link> */}
      </nav>
      <div className="header-right">
        {user && (
          <span className="user-info">
            Welcome, {user.username}
          </span>
        )}
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
    </header>
  );
};

export default Header;
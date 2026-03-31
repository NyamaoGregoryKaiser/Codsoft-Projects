import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">AuthSystem</Link>
        <ul className="navbar-nav">
          {user ? (
            <>
              <li className="nav-item"><Link to="/dashboard" className="nav-link">Dashboard</Link></li>
              <li className="nav-item"><Link to="/profile" className="nav-link">Profile</Link></li>
              <li className="nav-item"><Link to="/notes" className="nav-link">My Notes</Link></li>
              {user.roles.includes('ROLE_ADMIN') && (
                <li className="nav-item"><Link to="/admin" className="nav-link">Admin</Link></li>
              )}
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link logout-btn">Logout ({user.username})</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item"><Link to="/login" className="nav-link">Login</Link></li>
              <li className="nav-item"><Link to="/register" className="nav-link">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
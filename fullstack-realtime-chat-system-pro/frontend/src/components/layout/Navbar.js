import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/Navbar.css'; // Assume a separate CSS for Navbar

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Realtime Chat</Link>
      </div>
      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            <li className="nav-item">
              <span className="nav-link">Welcome, {currentUser?.username}</span>
            </li>
            <li className="nav-item">
              <button onClick={logout} className="nav-link logout-btn">Logout</button>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/login" className="nav-link">Login</Link>
            </li>
            <li className="nav-item">
              <Link to="/register" className="nav-link">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
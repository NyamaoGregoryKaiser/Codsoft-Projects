```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">ML Utilities Hub</Link>
      </div>
      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/models">Models</Link></li>
            <li><Link to="/datasets">Datasets</Link></li>
            <li><Link to="/inference-logs">Inference Logs</Link></li>
            <li className="navbar-dropdown">
              <span className="dropdown-toggle">Hello, {user?.username}</span>
              <div className="dropdown-menu">
                <Link to="/profile">Profile</Link>
                {user?.role === 'admin' && <Link to="/admin">Admin Panel</Link>} {/* Placeholder */}
                <button onClick={handleLogout}>Logout</button>
              </div>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
```
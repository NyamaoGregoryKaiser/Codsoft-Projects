import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import './Header.css';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="app-header">
      <nav>
        <Link to="/" className="logo">CMS System</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {isAuthenticated && <li><Link to="/dashboard">Dashboard</Link></li>}
          {isAuthenticated && user && (
            <li>
              <span>Welcome, {user.id.substring(0, 8)}... ({user.role})</span>
            </li>
          )}
          {isAuthenticated ? (
            <li>
              <button onClick={logout} className="logout-button">Logout</button>
            </li>
          ) : (
            <li><Link to="/login">Login</Link></li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
```
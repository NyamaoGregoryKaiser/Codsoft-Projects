```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
  const { user, logoutUser } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">PMS</Link>
        <nav className="nav">
          {user ? (
            <>
              <span>Welcome, {user.name}</span>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/projects">Projects</Link>
              <button onClick={logoutUser} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/auth">Login / Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
```
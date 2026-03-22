```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isAuthenticated, user, onLogout }) => {
  return (
    <header className="header">
      <h1><Link to="/">Secure Task Management</Link></h1>
      <nav>
        {!isAuthenticated ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span>Welcome, {user?.full_name || user?.email}! ({user?.role})</span>
            <button onClick={onLogout}>Logout</button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
```
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>
        {isAuthenticated && <Link to="/products">Products</Link>}
        {isAuthenticated && <Link to="/profile">Profile</Link>}
      </div>
      <div className="auth-buttons">
        {isAuthenticated ? (
          <>
            <span>Welcome, {user.username} ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
```
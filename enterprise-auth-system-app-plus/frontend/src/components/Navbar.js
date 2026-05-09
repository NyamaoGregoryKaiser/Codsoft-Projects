```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">SecureAuthApp</Link>
      <div className="navbar-nav">
        {isAuthenticated ? (
          <>
            <span>Welcome, {user?.first_name || user?.email}!</span>
            <Link to="/">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            {user?.is_admin && <Link to="/admin/users">Admin Users</Link>}
            <a href="#" onClick={logout}>Logout</a>
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
};

export default Navbar;
```
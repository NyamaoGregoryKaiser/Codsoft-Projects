```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Header = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header>
      <h1><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>SecureSphere</Link></h1>
      <nav>
        <ul>
          {isAuthenticated ? (
            <>
              <li>Hello, {user?.email} ({user?.role})</li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              {isAdmin && <li><Link to="/admin">Admin</Link></li>}
              <li>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
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
    </header>
  );
};

export default Header;
```
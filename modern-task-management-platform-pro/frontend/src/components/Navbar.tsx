```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={isAuthenticated ? "/dashboard" : "/"}>TaskFlow</Link>
      </div>
      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            {user?.role === 'admin' && (
              <li><Link to="/admin">Admin Panel</Link></li>
            )}
            <li>Hello, {user?.firstName}</li>
            <li><button onClick={logout} className="navbar-logout-btn">Logout</button></li>
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
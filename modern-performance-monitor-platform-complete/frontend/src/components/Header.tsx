```typescript jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1>PerfoMetrics</h1>
      </Link>
      <nav>
        {isAuthenticated && (
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/alerts">Alerts</Link></li>
          </ul>
        )}
      </nav>
      {isAuthenticated ? (
        <div className="user-info">
          <span>Welcome, {user?.username} ({user?.role})</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div className="user-info">
          <Link to="/login" className="btn btn-secondary">Login</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
```
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="header">
      <h1><Link to="/">CMS Blog</Link></h1>
      <nav>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {isAuthenticated && (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              {/* Add more links based on user roles if necessary */}
            </>
          )}
        </ul>
      </nav>
      <div className="auth-buttons">
        {isAuthenticated ? (
          <>
            <span>Hello, {user?.username} ({user?.role})</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login"><button>Login</button></Link>
        )}
      </div>
    </header>
  );
}

export default Header;
```
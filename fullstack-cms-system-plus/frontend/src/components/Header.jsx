```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isAuthenticated, userRole, onLogout }) => {
  return (
    <header>
      <h1><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>CMS Pro</Link></h1>
      <nav>
        <Link to="/">Home</Link>
        {isAuthenticated && userRole && (userRole === 'ADMIN' || userRole === 'EDITOR') && (
          <Link to="/admin/content">Admin Content</Link>
        )}
        {/* Add more admin links here for categories, users, media, etc. */}
        {isAuthenticated ? (
          <button onClick={onLogout}>Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
```
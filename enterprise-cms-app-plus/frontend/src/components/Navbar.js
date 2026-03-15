```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ isAuthenticated, onLogout, user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">CMS Dashboard</Link>
      </div>
      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            <li>Welcome, {user?.username || 'User'}!</li>
            <li><Link to="/posts">Posts</Link></li>
            <li><Link to="/pages">Pages</Link></li>
            <li><Link to="/media">Media</Link></li>
            {user?.is_staff && (
                 <>
                    <li><Link to="/categories">Categories</Link></li>
                    <li><Link to="/tags">Tags</Link></li>
                 </>
            )}
            <li><button onClick={handleLogout} className="logout-button">Logout</button></li>
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
}

export default Navbar;
```
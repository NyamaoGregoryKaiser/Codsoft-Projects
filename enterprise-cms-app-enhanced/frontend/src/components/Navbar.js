import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css'; // Basic styling

const Navbar = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">CMS</Link>
      </div>
      <ul className="navbar-nav">
        {isAuthenticated ? (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            {hasRole(['admin', 'editor']) && <li><Link to="/posts">Posts</Link></li>}
            {hasRole(['admin', 'editor']) && <li><Link to="/categories">Categories</Link></li>}
            {hasRole(['admin', 'editor', 'user']) && <li><Link to="/media">Media</Link></li>}
            {hasRole('admin') && <li><Link to="/users">Users</Link></li>}
            <li><span className="navbar-user">Hello, {user.name} ({user.role})</span></li>
            <li><button onClick={logout} className="navbar-logout">Logout</button></li>
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
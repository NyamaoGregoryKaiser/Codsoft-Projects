```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">Web Scraper</Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white">Dashboard</Link>
          <Link to="/jobs/new" className="text-gray-300 hover:text-white">Create Job</Link>
          {user && (
            <span className="text-gray-300">Welcome, {user.email} ({user.role})</span>
          )}
          <button onClick={handleLogout} className="btn btn-secondary bg-gray-600 text-white hover:bg-gray-700">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```
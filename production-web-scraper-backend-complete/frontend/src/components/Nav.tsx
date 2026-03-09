import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export const Nav: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-300 hover:text-indigo-100">
          ScrapingHub
        </Link>
        <div className="space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/scrapers" className="hover:text-gray-300">Scrapers</Link>
              <Link to="/jobs" className="hover:text-gray-300">Jobs</Link>
              {user?.is_superuser && (
                <Link to="/users" className="hover:text-gray-300">Users</Link>
              )}
              <span className="text-gray-400">Welcome, {user?.email}!</span>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="hover:text-gray-300">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
```
---
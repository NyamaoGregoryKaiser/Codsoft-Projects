```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon, LogoutIcon } from '@heroicons/react/outline'; // Using @heroicons/react/24/outline for newer syntax if available

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-400 hover:text-blue-200">
          ML Utilities
        </Link>
        <nav>
          {isAuthenticated ? (
            <ul className="flex space-x-4 items-center">
              <li>
                <Link to="/datasets" className="hover:text-blue-400">Datasets</Link>
              </li>
              <li>
                <Link to="/models" className="hover:text-blue-400">Models</Link>
              </li>
              <li>
                <Link to="/experiments" className="hover:text-blue-400">Experiments</Link>
              </li>
              <li className="flex items-center space-x-2">
                <UserCircleIcon className="h-6 w-6" />
                <span>{user?.username || 'User'}</span>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <LogoutIcon className="h-5 w-5" />
                </button>
              </li>
            </ul>
          ) : (
            <ul className="flex space-x-4">
              <li>
                <Link to="/login" className="hover:text-blue-400">Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-400">Register</Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
```
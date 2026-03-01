import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cog8ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'; // Example icons

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors duration-200">
          ProjectFlow
        </Link>
        <nav>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm">Welcome, {user?.email}</span>
              {/* <Link to="/profile" className="flex items-center space-x-1 hover:text-blue-200">
                <Cog8ToothIcon className="h-5 w-5" />
                <span>Profile</span>
              </Link> */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-md bg-blue-500 hover:bg-blue-700 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="px-3 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200">
                Login
              </Link>
              <Link to="/register" className="px-3 py-2 rounded-md hover:bg-blue-500 transition-colors duration-200">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
```
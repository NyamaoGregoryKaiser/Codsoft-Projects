import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">
          Web Scraper
        </Link>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/scrapers" className="text-gray-300 hover:text-white">
                Scrapers
              </Link>
              <Link to="/data" className="text-gray-300 hover:text-white">
                Scraped Data
              </Link>
              {user && user.role === 'admin' && (
                <Link to="/users" className="text-gray-300 hover:text-white">
                  Users
                </Link>
              )}
              <span className="text-gray-400">Hi, {user?.fullName || user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
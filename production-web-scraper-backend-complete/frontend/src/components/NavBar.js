import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold">Scraping Hub</Link>
        <div className="flex space-x-4 items-center">
          <Link to="/targets" className="hover:text-gray-300">Targets</Link>
          <Link to="/scrape-jobs" className="hover:text-gray-300">Jobs</Link>
          <Link to="/scraped-data" className="hover:text-gray-300">Data</Link>
          {user && user.role === 'admin' && (
            <Link to="/users" className="hover:text-gray-300">Users</Link> // Admin specific link
          )}
          {user && <span className="text-gray-400">Welcome, {user.name} ({user.role})</span>}
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
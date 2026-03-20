import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  HomeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  MagnifyingGlassCircleIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-dark text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold flex items-center">
          <MagnifyingGlassCircleIcon className="h-8 w-8 mr-2 text-primary" />
          DB Optimizer
        </Link>
        <ul className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition duration-200 ease-in-out flex items-center">
                  <HomeIcon className="h-5 w-5 mr-1" /> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/slow-queries" className="hover:text-primary transition duration-200 ease-in-out flex items-center">
                  <ClockIcon className="h-5 w-5 mr-1" /> Slow Queries
                </Link>
              </li>
              <li>
                <Link to="/index-suggestions" className="hover:text-primary transition duration-200 ease-in-out flex items-center">
                  <KeyIcon className="h-5 w-5 mr-1" /> Index Suggestions
                </Link>
              </li>
              <li>
                <Link to="/schema-analysis" className="hover:text-primary transition duration-200 ease-in-out flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-1" /> Schema Analysis
                </Link>
              </li>
              <li>
                <Link to="/metrics" className="hover:text-primary transition duration-200 ease-in-out flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-1" /> Metrics
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <UserCircleIcon className="h-6 w-6 text-accent" />
                <span>{user?.username} ({user?.role})</span>
              </li>
              <li>
                <button onClick={handleLogout} className="btn-primary flex items-center">
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="btn-primary">Login</Link>
              </li>
              <li>
                <Link to="/register" className="btn-secondary">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
```

#### `frontend/src/components/Card.js`
```javascript
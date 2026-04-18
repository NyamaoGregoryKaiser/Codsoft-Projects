import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          CMS
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
          <Link to="/content" className="text-gray-300 hover:text-white">Content</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <span className="text-gray-300">Welcome, {user?.firstName} ({user?.role.name})</span>
              <Button onClick={logout} variant="secondary">Logout</Button>
            </>
          )}
          {!isAuthenticated && (
            <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};
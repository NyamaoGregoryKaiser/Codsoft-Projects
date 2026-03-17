import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin, isEditor } = useAuth();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 p-4 shadow-md">
      <div className="container flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          CMS
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/content" className="text-white hover:text-indigo-200">
            Content
          </Link>
          {isAuthenticated && (isEditor || isAdmin) && (
            <Link to="/categories" className="text-white hover:text-indigo-200">
              Categories
            </Link>
          )}
          {isAuthenticated && isAdmin && (
            <Link to="/users" className="text-white hover:text-indigo-200">
              Users
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <span className="text-white text-sm hidden sm:block">
                Welcome, {user?.email} ({user?.role})
              </span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-indigo-200">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
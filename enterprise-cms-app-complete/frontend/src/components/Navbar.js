import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../utils/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          CMS Project
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          {user ? (
            <>
              {['admin', 'editor', 'author'].includes(user.role) && (
                <Link to="/admin/posts" className="hover:text-gray-300">My Posts</Link>
              )}
              {['admin', 'editor'].includes(user.role) && (
                <Link to="/admin/categories" className="hover:text-gray-300">Categories</Link>
              )}
              {['admin', 'editor', 'author'].includes(user.role) && (
                <Link to="/admin/media" className="hover:text-gray-300">Media</Link>
              )}
              <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
              <Link to="/profile" className="hover:text-gray-300">Profile ({user.username})</Link>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">
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

export default Navbar;
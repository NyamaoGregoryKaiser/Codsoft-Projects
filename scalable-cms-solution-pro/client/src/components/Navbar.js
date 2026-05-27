```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ECM CMS</Link>
        <div>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.username} ({user?.role})</span>
              <Link to="/posts" className="hover:text-gray-300">Posts</Link>
              {/* Add more nav links based on user role if needed */}
              {['admin', 'editor'].includes(user?.role) && (
                <>
                  <Link to="/categories" className="hover:text-gray-300">Categories</Link>
                  <Link to="/users" className="hover:text-gray-300">Users</Link>
                  <Link to="/media" className="hover:text-gray-300">Media</Link>
                </>
              )}
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
```
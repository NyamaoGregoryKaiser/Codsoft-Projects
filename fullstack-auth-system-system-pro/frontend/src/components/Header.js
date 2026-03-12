import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition duration-300">SecureAuth</Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/posts" className="hover:text-gray-300 transition duration-300">Posts</Link></li>
            {isAuthenticated ? (
              <>
                <li><Link to="/dashboard" className="hover:text-gray-300 transition duration-300">Dashboard</Link></li>
                <li><Link to="/profile" className="hover:text-gray-300 transition duration-300">Profile</Link></li>
                {user?.role?.name === 'Admin' && (
                  <li><Link to="/admin/users" className="hover:text-gray-300 transition duration-300">Admin Users</Link></li>
                )}
                <li className="font-semibold">{user?.username}</li>
                <li>
                  <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition duration-300">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="hover:text-gray-300 transition duration-300">Login</Link></li>
                <li><Link to="/register" className="hover:text-gray-300 transition duration-300">Register</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
```
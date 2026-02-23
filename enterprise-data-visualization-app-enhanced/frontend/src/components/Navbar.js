```javascript
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

  const isAdmin = user?.roles?.includes('admin');
  const isEditor = user?.roles?.includes('editor');

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Dashboard App</Link>
        <ul className="flex space-x-4">
          <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
          {isAuthenticated ? (
            <>
              <li><Link to="/dashboards" className="hover:text-gray-300">Dashboards</Link></li>
              {isEditor && <li><Link to="/visualizations" className="hover:text-gray-300">Visualizations</Link></li>}
              {isEditor && <li><Link to="/data-sources" className="hover:text-gray-300">Data Sources</Link></li>}
              <li>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md">
                  Logout ({user?.username})
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
              <li><Link to="/register" className="hover:text-gray-300">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
```
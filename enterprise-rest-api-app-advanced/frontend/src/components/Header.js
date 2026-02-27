import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ProjectPulse</Link>
        <nav>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-lg">Hello, {user?.username} ({user?.role})</span>
              <button onClick={handleLogout} className="button-secondary bg-indigo-700 hover:bg-indigo-800 text-white border-transparent">Logout</button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="hover:text-gray-200">Login</Link>
              <Link to="/register" className="hover:text-gray-200">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
```
**`frontend/src/components/Button.js`**
```javascript
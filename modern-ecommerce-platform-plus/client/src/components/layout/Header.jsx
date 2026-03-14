```javascript
// client/src/components/layout/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline'; // Example icons

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-yellow-400 hover:text-yellow-300">
          E-Shop
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/products" className="hover:text-gray-300">Products</Link>
          <Link to="/cart" className="relative hover:text-gray-300">
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-4 w-4 flex items-center justify-center text-xs">
              {/* Cart item count goes here */}0
            </span>
          </Link>
          {user ? (
            <div className="relative group">
              <button className="flex items-center hover:text-gray-300">
                <UserIcon className="h-6 w-6 mr-1" />
                {user.name || user.email.split('@')[0]}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg hidden group-hover:block z-10">
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">Admin Dashboard</Link>
                )}
                <button onClick={logout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-md hover:bg-yellow-400">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

```
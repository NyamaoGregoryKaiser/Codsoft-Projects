import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartItemCount } = useCart();

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
          E-Shop
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/products" className="hover:text-blue-200 transition-colors">Products</Link>
          <Link to="/cart" className="hover:text-blue-200 transition-colors relative">
            Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hover:text-blue-200 transition-colors">
                Hi, {user?.name || 'User'}
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin-dashboard" className="hover:text-blue-200 transition-colors bg-blue-700 px-3 py-1 rounded">
                  Admin
                </Link>
              )}
              <button onClick={logout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition-colors">Login</Link>
              <Link to="/register" className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition-colors">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
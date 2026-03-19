import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cartItemCount = getCartItemCount();

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          E-Shop
        </Link>
        <nav className="space-x-4">
          <Link to="/products" className="hover:text-gray-200">
            Products
          </Link>
          <Link to="/cart" className="hover:text-gray-200 relative">
            Cart 
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-gray-200">
                  Admin
                </Link>
              )}
              <span className="hidden md:inline">Hello, {user?.firstName}</span>
              <button onClick={handleLogout} className="hover:text-gray-200">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-200">
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-200">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
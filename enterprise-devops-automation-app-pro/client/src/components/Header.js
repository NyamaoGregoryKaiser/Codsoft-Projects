import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Header() {
  const { user, handleLogout, isAdmin } = useAuth();

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">E-Shop</Link>
        <ul className="flex space-x-4 items-center">
          <li><Link to="/products" className="hover:text-gray-300">Products</Link></li>
          {user ? (
            <>
              <li><Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link></li>
              {isAdmin && <li><Link to="/admin/users" className="hover:text-gray-300">Users (Admin)</Link></li>}
              <li>
                <button onClick={handleLogout} className="btn btn-secondary !bg-gray-600 !text-white hover:!bg-gray-700">Logout ({user.username || user.email || 'User'})</button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
              <li><Link to="/register" className="btn btn-primary">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
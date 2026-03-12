```javascript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CurrencyDollarIcon, UserCircleIcon, ShoppingCartIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold flex items-center">
          <CurrencyDollarIcon className="h-7 w-7 mr-2" />
          PayPro
        </Link>
        <nav className="flex items-center space-x-6">
          <Link to="/products" className="hover:text-indigo-200">Products</Link>
          {isAuthenticated ? (
            <>
              {user.role === 'merchant' && (
                <Link to="/merchant/dashboard" className="flex items-center hover:text-indigo-200">
                  <BuildingStorefrontIcon className="h-5 w-5 mr-1" />
                  Merchant Dashboard
                </Link>
              )}
              {user.role === 'customer' && (
                 <Link to="/cart" className="flex items-center hover:text-indigo-200">
                  <ShoppingCartIcon className="h-5 w-5 mr-1" />
                  Cart (Not Implemented)
                </Link>
              )}
              <span className="flex items-center">
                <UserCircleIcon className="h-6 w-6 mr-1" />
                {user.email} ({user.role})
              </span>
              <button onClick={handleLogout} className="btn btn-secondary bg-indigo-500 text-white hover:bg-indigo-400">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-200">Login</Link>
              <Link to="/register" className="btn btn-secondary bg-indigo-500 text-white hover:bg-indigo-400">
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
```

#### Other Frontend Pages/Components (Conceptual/Simplified)

For brevity, I'll provide `LoginPage.js` as an example. Other pages would follow similar patterns for data fetching, state management, and form handling.
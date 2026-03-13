```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Button from '@components/Common/Button';
import { UserRole } from '@types-frontend/enums';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Product Catalog
        </Link>
        <nav className="space-x-4">
          <Link to="/products" className="hover:underline">
            Products
          </Link>
          <Link to="/categories" className="hover:underline">
            Categories
          </Link>
          {isAuthenticated && user?.role === UserRole.ADMIN && (
            <Link to="/users" className="hover:underline">
              Users
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <span className="text-sm">Welcome, {user?.username} ({user?.role})</span>
              <Button onClick={handleLogout} variant="secondary" size="sm" className="bg-blue-500 hover:bg-blue-700 text-white">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
              <Link to="/register" className="hover:underline">
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
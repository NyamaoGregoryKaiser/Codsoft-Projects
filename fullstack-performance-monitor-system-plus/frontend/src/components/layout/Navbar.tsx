import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-card-bg dark:bg-dark-card-bg shadow-sm border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold text-primary dark:text-secondary">
          AppInsight
        </Link>
        {isAuthenticated && (
          <div className="ml-8 space-x-4 hidden md:flex">
            <Link to="/projects" className="text-text hover:text-primary dark:text-dark-text dark:hover:text-secondary transition-colors">
              Projects
            </Link>
            {/* Add more nav links here */}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Welcome, {user?.name || 'User'}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Register</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
```

```
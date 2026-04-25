```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully!');
    navigate('/login');
  };

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="container py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          ProjectFlow
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/projects" className="hover:text-indigo-200">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-indigo-200">
                    Hello, {user?.username || 'User'}!
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1 rounded-md"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="hover:text-indigo-200">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-indigo-200">
                    Register
                  </Link>
                </li>
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
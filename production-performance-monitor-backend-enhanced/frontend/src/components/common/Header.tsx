```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserIcon, ClipboardDocumentListIcon, Squares2X2Icon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-800 to-purple-900 shadow-lg p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          TaskFlow
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-1 hover:text-indigo-200">
            <Squares2X2Icon className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/projects" className="flex items-center space-x-1 hover:text-indigo-200">
            <ClipboardDocumentListIcon className="h-5 w-5" />
            <span>Projects</span>
          </Link>
          {user && (
            <span className="flex items-center space-x-1 text-indigo-200">
              <UserIcon className="h-5 w-5" />
              <span>{user.username}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-700 rounded-md hover:bg-indigo-600 transition duration-200"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
```
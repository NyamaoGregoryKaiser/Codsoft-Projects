```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, userRole, logout, isAuthenticated } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Content Types', path: '/content-types', icon: CubeIcon, roles: ['admin'] },
    { name: 'Entries', path: '/entries', icon: DocumentTextIcon, roles: ['admin', 'editor'] }, // This will be a generic link, actual entries are per content type
    { name: 'Media Library', path: '/media', icon: PhotoIcon, roles: ['admin', 'editor'] },
    { name: 'Users', path: '/users', icon: UsersIcon, roles: ['admin'] },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {isAuthenticated && (
        <aside className="w-64 bg-dark text-white flex flex-col p-4 shadow-lg">
          <div className="flex-shrink-0 mb-8">
            <Link to="/dashboard" className="text-2xl font-bold text-primary flex items-center">
              <CubeIcon className="h-8 w-8 mr-2 text-accent" /> NimbusCMS
            </Link>
          </div>
          <nav className="flex-grow">
            <ul>
              {navItems.map((item) => (
                (item.roles.includes(userRole)) && (
                  <li key={item.name} className="mb-2">
                    <Link
                      to={item.path}
                      className="flex items-center p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                )
              ))}
            </ul>
          </nav>
          <div className="mt-auto pt-4 border-t border-gray-700">
            {user && (
              <div className="text-sm text-gray-400 mb-2">
                Logged in as: <span className="font-semibold text-white">{user.username} ({user.role})</span>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center p-3 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {!isAuthenticated && (
          <div className="max-w-md mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
            {children}
          </div>
        )}
        {isAuthenticated && children}
      </main>
    </div>
  );
};

export default Layout;
```
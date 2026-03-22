```javascript
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, roles: ['USER', 'ADMIN'] },
    { name: 'Projects', path: '/projects', icon: FolderIcon, roles: ['USER', 'ADMIN'] },
    { name: 'Tasks', path: '/tasks', icon: ClipboardDocumentCheckIcon, roles: ['USER', 'ADMIN'] },
    { name: 'Profile', path: '/profile', icon: UserIcon, roles: ['USER', 'ADMIN'] },
    { name: 'Users', path: '/users', icon: UserGroupIcon, roles: ['ADMIN'] }, // Admin only
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 space-y-4 shadow-lg hidden md:flex flex-col">
      <div className="text-3xl font-bold text-indigo-400 mb-6">TaskFlow</div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user?.role)) {
              return null; // Don't render if user doesn't have the role
            }
            const isActive = location.pathname.startsWith(item.path) && item.path !== '/';
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg text-lg ${
                    isActive
                      ? 'bg-indigo-700 text-white shadow-md'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <item.icon className="h-6 w-6 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="text-sm text-gray-500 mt-auto pt-4 border-t border-gray-700">
        © {new Date().getFullYear()} TaskFlow. All rights reserved.
      </div>
    </aside>
  );
};

export default Sidebar;
```
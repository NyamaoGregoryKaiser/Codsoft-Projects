import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ServerStackIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon,
  UsersIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@hooks/useAuth';
import { UserRole } from '@types/auth';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, roles: [UserRole.ADMIN, UserRole.USER] },
    { name: 'Databases', path: '/databases', icon: ServerStackIcon, roles: [UserRole.ADMIN, UserRole.USER] },
    { name: 'Suggestions', path: '/databases/:dbId/suggestions', icon: LightBulbIcon, roles: [UserRole.ADMIN, UserRole.USER], dynamic: true },
    { name: 'Tasks', path: '/tasks', icon: ClipboardDocumentListIcon, roles: [UserRole.ADMIN, UserRole.USER] },
    { name: 'Users', path: '/users', icon: UsersIcon, roles: [UserRole.ADMIN] }, // Admin only
  ];

  const getNavLinkClass = (path: string, isDynamic: boolean = false) => {
    const baseClass = "flex items-center p-2 rounded-md hover:bg-indigo-500 hover:text-white transition-colors duration-200";
    const activeClass = "bg-indigo-600 text-white shadow-md";

    if (isDynamic) {
        // For dynamic paths like /databases/:dbId/suggestions
        // Check if the current path starts with the base part of the dynamic path
        const basePath = path.split('/:')[0]; // e.g., /databases
        if (location.pathname.startsWith(basePath) && (location.pathname.includes('/suggestions') || location.pathname.includes('/metrics'))) {
            return twMerge(baseClass, activeClass);
        }
    } else if (location.pathname === path) {
        return twMerge(baseClass, activeClass);
    }
    return twMerge(baseClass, "text-gray-800");
  };

  return (
    <>
      {/* Overlay for mobile view */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link to="/dashboard" className="text-2xl font-bold text-indigo-700">DBOptiFlow</Link>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden">
            <ArrowLeftOnRectangleIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <nav className="flex-1 p-4 custom-scrollbar overflow-y-auto">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              // Only render if user has the required role
              if (link.roles && user && !link.roles.includes(user.role)) {
                return null;
              }
              // Skip dynamic links from main sidebar, they are accessed via database detail page
              if (link.dynamic) {
                return null;
              }

              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={getNavLinkClass(link.path)}
                    onClick={onClose}
                  >
                    <link.icon className="w-6 h-6 mr-3" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center w-full p-2 text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Bars3Icon, UserCircleIcon, Cog6ToothIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>
        <Link to="/dashboard" className="text-2xl font-bold text-indigo-700">DBOptiFlow</Link>
      </div>

      <div className="relative flex items-center gap-4">
        <span className="text-gray-700">Hello, {user?.fullName || user?.username}!</span>
        <div className="group relative">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <UserCircleIcon className="w-6 h-6" />
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
              <p className="font-medium">{user?.username}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <UserCircleIcon className="w-5 h-5 mr-2" /> Profile
            </Link>
            <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Cog6ToothIcon className="w-5 h-5 mr-2" /> Settings
            </Link>
            <button onClick={logout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <ArrowRightEndOnRectangleIcon className="w-5 h-5 mr-2" /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
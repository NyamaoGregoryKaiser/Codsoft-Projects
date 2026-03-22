```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserCircleIcon, PowerIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b-4 border-indigo-600">
      <div className="flex items-center">
        {/* Placeholder for future search or branding */}
        <h2 className="text-2xl font-semibold text-gray-800">TaskFlow</h2>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <button className="flex items-center text-gray-700 focus:outline-none">
            <span className="mr-2 text-sm font-medium">{user?.firstName || user?.email}</span>
            <UserCircleIcon className="h-8 w-8 text-gray-500" />
          </button>
          {/* Dropdown for profile/logout - not implemented as a full dropdown for brevity */}
          <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20 hidden">
            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white">Profile</Link>
            <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white">Logout</button>
          </div>
        </div>

        <button
          onClick={logout}
          className="ml-4 flex items-center p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          title="Logout"
        >
          <PowerIcon className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
```
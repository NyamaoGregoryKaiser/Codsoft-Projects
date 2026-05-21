import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-primary shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/dashboard" className="text-white text-2xl font-bold">
          TaskFlow
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-primary-light hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Dashboard
          </Link>
          <Link to="/projects" className="text-primary-light hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Projects
          </Link>
          
          <Menu as="div" className="relative ml-3">
            <div>
              <Menu.Button className="relative flex max-w-xs items-center rounded-full bg-primary text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                {user?.username ? (
                  <span className="text-white text-md mr-2">{user.username}</span>
                ) : (
                  <span className="text-white text-md mr-2">Profile</span>
                )}
                <UserCircleIcon className="h-8 w-8 text-white" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile" // Placeholder for a user profile page
                      className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                    >
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700')}
                    >
                      Sign out
                    </Button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </nav>
      </div>
    </header>
  );
};

export default Header;
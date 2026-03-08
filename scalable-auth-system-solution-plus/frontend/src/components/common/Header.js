import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { UserRole } from '../../utils/constants';

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/', current: true },
    isAuthenticated && { name: 'Dashboard', href: '/dashboard', current: false },
    isAuthenticated && { name: 'Tasks', href: '/tasks', current: false },
    isAuthenticated && { name: 'Profile', href: '/profile', current: false },
    // isAuthenticated && user?.roles.includes(UserRole.ADMIN) && { name: 'Admin Panel', href: '/admin', current: false },
  ].filter(Boolean); // Filter out false values

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Auth System</span>
            <img className="h-8 w-auto" src="/logo.svg" alt="Auth System Logo" />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-indigo-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link key={item.name} to={item.href} className="text-sm font-semibold leading-6 text-white hover:text-indigo-200">
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center">
          {isAuthenticated ? (
            <>
              <span className="text-white text-sm font-medium mr-4">Hello, {user?.username} ({user?.roles.join(', ')})</span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold leading-6 text-white mr-4 hover:text-indigo-200">
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link to="/register" className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute inset-x-0 top-0 z-50 origin-top-right transform p-2 transition">
          <div className="rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="flex items-center justify-between p-4">
              <Link to="/" className="-m-1.5 p-1.5">
                <span className="sr-only">Auth System</span>
                <img className="h-8 w-auto" src="/logo.svg" alt="Auth System Logo" />
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-2 py-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="py-6">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 w-full text-left"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
```
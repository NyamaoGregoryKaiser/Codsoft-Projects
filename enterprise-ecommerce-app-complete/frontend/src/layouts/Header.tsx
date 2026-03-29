```typescript
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import { ShoppingCartIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:text-red-600 transition-colors">
          E-Shop
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/products" className="text-gray-700 hover:text-primary transition-colors">
            Shop
          </Link>
          <Link href="/categories" className="text-gray-700 hover:text-primary transition-colors">
            Categories
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/cart" className="relative text-gray-700 hover:text-primary transition-colors">
            <ShoppingCartIcon className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1">
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="hidden sm:inline font-medium">{user?.firstName}</span>
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-3 w-48 max-w-sm transform px-4 sm:px-0 lg:max-w-3xl">
                      <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="relative grid gap-4 bg-white p-4">
                          <Link href="/profile" className="block text-gray-900 hover:bg-gray-50 p-2 rounded-md transition-colors">
                            My Profile
                          </Link>
                          <Link href="/orders" className="block text-gray-900 hover:bg-gray-50 p-2 rounded-md transition-colors">
                            My Orders
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link href="/admin" className="block text-gray-900 hover:bg-gray-50 p-2 rounded-md transition-colors">
                              Admin Dashboard
                            </Link>
                          )}
                          <button
                            onClick={logout}
                            className="w-full text-left text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1">
              <UserCircleIcon className="h-6 w-6" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                    <span className="sr-only">Open main menu</span>
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  </Popover.Button>

                  <Transition
                    as={Fragment}
                    enter="duration-150 ease-out"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="duration-100 ease-in"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Popover.Panel
                      focus
                      className="absolute inset-x-0 top-0 origin-top-right transform p-2 transition md:hidden"
                    >
                      <div className="rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 divide-y-2 divide-gray-50">
                        <div className="px-5 pt-5 pb-6">
                          <div className="flex items-center justify-between">
                            <Link href="/" className="text-xl font-bold text-primary">E-Shop</Link>
                            <div className="-mr-2">
                              <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                                <span className="sr-only">Close menu</span>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Popover.Button>
                            </div>
                          </div>
                          <div className="mt-6">
                            <nav className="grid gap-y-8">
                              <Link href="/products" className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50">
                                <span className="ml-3 text-base font-medium text-gray-900">Shop</span>
                              </Link>
                              <Link href="/categories" className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50">
                                <span className="ml-3 text-base font-medium text-gray-900">Categories</span>
                              </Link>
                              <Link href="/about" className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50">
                                <span className="ml-3 text-base font-medium text-gray-900">About</span>
                              </Link>
                              {isAuthenticated && (
                                <>
                                  <Link href="/profile" className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50">
                                    <span className="ml-3 text-base font-medium text-gray-900">My Profile</span>
                                  </Link>
                                  <Link href="/orders" className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50">
                                    <span className="ml-3 text-base font-medium text-gray-900">My Orders</span>
                                  </Link>
                                  {user?.role === 'ADMIN' && (
                                    <Link href="/admin" className="-m-3 flex items-center rounded-md p-3 hover:bg-gray-50">
                                      <span className="ml-3 text-base font-medium text-gray-900">Admin Dashboard</span>
                                    </Link>
                                  )}
                                </>
                              )}
                            </nav>
                          </div>
                        </div>
                        <div className="space-y-6 py-6 px-5">
                          {isAuthenticated ? (
                            <button
                              onClick={logout}
                              className="w-full flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-600"
                            >
                              Logout
                            </button>
                          ) : (
                            <>
                              <Link href="/register" className="w-full flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-600">
                                Sign up
                              </Link>
                              <p className="mt-6 text-center text-base font-medium text-gray-500">
                                Existing customer?{' '}
                                <Link href="/login" className="text-primary hover:text-red-600">
                                  Sign in
                                </Link>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
```
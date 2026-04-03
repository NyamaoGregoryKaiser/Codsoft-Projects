```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
        Welcome to the <span className="text-blue-600">AuthSystem</span>
      </h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl">
        Your comprehensive solution for secure authentication and task management.
        Get started by registering or logging in to manage your personal tasks.
      </p>
      <div className="flex space-x-4">
        {!isAuthenticated ? (
          <>
            <Link
              to="/register"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            >
              Login
            </Link>
          </>
        ) : (
          <Link
            to="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
      <div className="mt-12 text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} AuthSystem. All rights reserved.</p>
      </div>
    </div>
  );
};

export default HomePage;
```
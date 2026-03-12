import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to SecureAuth System</h1>
        <p className="text-lg text-gray-600 mb-6">
          A comprehensive full-stack authentication system built with Flask and React.
          Demonstrates robust user management, JWT authentication, RBAC, and more.
        </p>
        
        {!isAuthenticated ? (
          <div className="space-x-4">
            <Link 
              to="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="text-xl text-gray-700">
            <p className="mb-4">Hello, <span className="font-semibold text-blue-600">{user?.username}</span>!</p>
            <p>You are logged in as a <span className="font-semibold text-purple-600">{user?.role?.name}</span>.</p>
            <Link 
              to="/dashboard" 
              className="mt-6 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-gray-500 text-sm">
          <p>Explore the features: User profiles, protected routes, admin panel, and more.</p>
          <p>Check out the <Link to="/posts" className="text-blue-500 hover:underline">Posts section</Link> to see protected resources.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
```
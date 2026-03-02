import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-6xl font-extrabold text-indigo-600 mb-4">404</h1>
      <p className="text-2xl text-gray-800 font-semibold mb-2">Page Not Found</p>
      <p className="text-lg text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
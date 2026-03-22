```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg text-center">
        <h2 className="text-6xl font-extrabold text-indigo-600">404</h2>
        <h3 className="mt-4 text-2xl font-bold text-gray-800">Page Not Found</h3>
        <p className="text-gray-600 mt-2">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
```
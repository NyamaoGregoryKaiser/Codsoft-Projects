import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md text-center">
        <h1 className="text-9xl font-extrabold text-blue-600 mb-4">404</h1>
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
```
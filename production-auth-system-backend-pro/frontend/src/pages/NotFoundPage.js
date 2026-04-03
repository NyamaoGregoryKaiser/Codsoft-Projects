```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center bg-gray-50">
      <h1 className="text-9xl font-extrabold text-blue-600">404</h1>
      <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-4">Page Not Found</h2>
      <p className="text-lg text-gray-600 mb-8">
        Oops! The page you are looking for does not exist. It might have been moved or deleted.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
```
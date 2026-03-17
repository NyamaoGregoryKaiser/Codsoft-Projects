import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-50 text-center">
      <h1 className="text-9xl font-extrabold text-indigo-600 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
      <p className="text-lg text-gray-600 mb-8">
        Oops! The page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;
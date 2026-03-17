import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] bg-gray-50 text-center">
      <h1 className="text-9xl font-extrabold text-red-600 mb-4">403</h1>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Unauthorized Access</h2>
      <p className="text-lg text-gray-600 mb-8">
        You do not have the necessary permissions to view this page.
      </p>
      <Link to="/" className="btn btn-primary">
        Go to Homepage
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
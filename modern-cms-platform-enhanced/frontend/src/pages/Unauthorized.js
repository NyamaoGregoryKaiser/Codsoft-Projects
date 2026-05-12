```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900">
      <ShieldExclamationIcon className="h-24 w-24 text-yellow-600 mb-4" />
      <h1 className="text-6xl font-extrabold mb-4">403</h1>
      <p className="text-2xl font-semibold mb-8">Unauthorized Access</p>
      <p className="text-lg text-gray-700 mb-8 text-center">You do not have the necessary permissions to view this page.</p>
      <Link to="/dashboard" className="px-6 py-3 bg-primary text-white rounded-md text-lg hover:bg-secondary transition-colors duration-200">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
```
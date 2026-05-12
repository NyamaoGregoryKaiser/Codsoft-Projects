```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { FaceFrownIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900">
      <FaceFrownIcon className="h-24 w-24 text-red-500 mb-4" />
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <p className="text-2xl font-semibold mb-8">Page Not Found</p>
      <Link to="/dashboard" className="px-6 py-3 bg-primary text-white rounded-md text-lg hover:bg-secondary transition-colors duration-200">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
```
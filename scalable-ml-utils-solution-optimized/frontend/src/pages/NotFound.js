```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const NotFound = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)]"> {/* Adjust height based on header */}
      <Card title="404 - Page Not Found" className="text-center">
        <p className="text-lg text-gray-700 mb-4">
          Oops! The page you're looking for does not exist.
        </p>
        <Link to="/" className="btn-primary">
          Go to Dashboard
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
```
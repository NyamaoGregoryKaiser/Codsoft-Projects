import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background px-4">
      <Card className="max-w-md w-full text-center p-8">
        <h1 className="text-6xl font-extrabold text-primary dark:text-secondary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-text dark:text-dark-text mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Oops! The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button>Go to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFoundPage;
```

```
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Button from '@components/Common/Button';

const HomePage: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6 animate-fade-in">
        Welcome to the Product Catalog
      </h1>
      <p className="text-xl text-gray-700 mb-8 text-center max-w-2xl">
        Your ultimate solution for managing products and categories with ease.
        Designed for efficiency and scalability.
      </p>

      <div className="flex space-x-4">
        {isAuthenticated ? (
          <>
            <Link to="/products">
              <Button size="lg">View Products</Button>
            </Link>
            <Link to="/categories">
              <Button variant="secondary" size="lg">Manage Categories</Button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button size="lg">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">Register</Button>
            </Link>
          </>
        )}
      </div>

      {isAuthenticated && (
        <div className="mt-12 text-gray-700 text-lg">
          <p>You are logged in as <span className="font-semibold">{user?.username}</span> with role <span className="font-semibold">{user?.role}</span>.</p>
          <p className="mt-2">Explore the features using the navigation above!</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
```
```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="text-center py-16">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
        Welcome to <span className="text-indigo-600">ProjectFlow</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Your ultimate solution for seamless project and task management.
      </p>
      {isAuthenticated ? (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Hello, <span className="font-semibold text-indigo-700">{user?.username}</span>!
            Ready to manage your tasks?
          </p>
          <Link to="/projects" className="btn-primary inline-block">
            Go to My Projects
          </Link>
          <Link to="/profile" className="btn-secondary inline-block ml-4">
            View Profile
          </Link>
        </div>
      ) : (
        <div className="space-x-4">
          <Link to="/login" className="btn-primary">
            Get Started - Login
          </Link>
          <Link to="/register" className="btn-secondary">
            Register
          </Link>
        </div>
      )}

      <section className="mt-16 bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Why ProjectFlow?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Intuitive Interface</h3>
            <p className="text-gray-700">
              Easily create, view, and manage your projects and tasks with a clean and user-friendly design.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Powerful Features</h3>
            <p className="text-gray-700">
              From authentication to task assignment, ProjectFlow provides all the tools you need for effective team collaboration.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Secure & Reliable</h3>
            <p className="text-gray-700">
              Built with robust security measures and a scalable architecture for your peace of mind.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
```
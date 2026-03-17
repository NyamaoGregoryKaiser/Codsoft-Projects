import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container py-12 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
        Welcome to the Enterprise CMS
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Your powerful platform for managing content efficiently. Create, edit, and publish articles with ease.
      </p>
      <div className="space-x-4">
        <Link to="/content" className="btn btn-primary btn-lg">
          View Content
        </Link>
        <Link to="/login" className="btn btn-secondary btn-lg">
          Login to Dashboard
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Management</h2>
          <p className="text-gray-700">
            Create and manage articles, blog posts, and pages with a rich text editor.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Roles & Permissions</h2>
          <p className="text-gray-700">
            Define granular access control with Admin, Editor, and Viewer roles.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Organized Categories</h2>
          <p className="text-gray-700">
            Categorize your content for better organization and navigation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
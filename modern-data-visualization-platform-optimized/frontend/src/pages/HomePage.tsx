import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-6xl font-extrabold text-gray-900">DataViz</h1>
        <p className="mt-2 text-xl text-gray-600">
          Your enterprise-grade data visualization platform.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/login"
            className="group relative w-auto flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="group relative w-auto flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-blue-600 bg-white border-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign Up
          </Link>
        </div>
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800">Key Features:</h2>
          <ul className="mt-4 list-disc list-inside text-left text-lg text-gray-700 space-y-2">
            <li>Interactive Dashboards with drag-and-drop.</li>
            <li>Connect to various Data Sources (PostgreSQL, MySQL, REST APIs, CSV).</li>
            <li>Rich Visualization types (Bar, Line, Pie charts, Tables).</li>
            <li>Role-based Access Control.</li>
            <li>Secure Authentication (JWT).</li>
            <li>Scalable Backend with caching and rate limiting.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
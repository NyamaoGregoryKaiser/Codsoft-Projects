import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-600">
        Please log in to view the dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <p className="text-lg text-gray-700 mb-4">
          Welcome back, <span className="font-semibold text-indigo-600">{user.username}</span>!
        </p>
        <p className="text-md text-gray-600 mb-8">
          Your role: <span className="font-medium text-purple-600">{user.role.name}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/profile" className="block p-6 bg-blue-100 rounded-lg shadow hover:shadow-md transition duration-300">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">My Profile</h2>
            <p className="text-gray-700">View and update your personal information.</p>
          </Link>

          <Link to="/posts" className="block p-6 bg-green-100 rounded-lg shadow hover:shadow-md transition duration-300">
            <h2 className="text-xl font-semibold text-green-800 mb-2">My Posts</h2>
            <p className="text-gray-700">Manage your created posts.</p>
          </Link>
          
          {user.role.name === 'Admin' && (
            <Link to="/admin/users" className="block p-6 bg-red-100 rounded-lg shadow hover:shadow-md transition duration-300">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Admin Panel</h2>
              <p className="text-gray-700">Manage all users and system settings.</p>
            </Link>
          )}

          <div className="block p-6 bg-yellow-100 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">API Documentation</h2>
            <p className="text-gray-700">Explore the backend API endpoints (Swagger/OpenAPI).</p>
            <a href="http://localhost:5000/apidocs/" target="_blank" rel="noopener noreferrer" className="text-yellow-700 hover:underline mt-2 inline-block">View Docs</a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```
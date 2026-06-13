import React, { useContext } from 'react';
import AuthContext from '../utils/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <div className="text-center text-gray-600">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Welcome, {user.username}!</h1>
      <p className="text-lg text-gray-600 mb-8">Your role: <span className="font-semibold capitalize">{user.role}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Post Management */}
        {['admin', 'editor', 'author'].includes(user.role) && (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Content Management</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><Link to="/admin/posts" className="text-blue-600 hover:underline">View All Posts</Link></li>
              <li><Link to="/admin/posts/new" className="text-blue-600 hover:underline">Create New Post</Link></li>
            </ul>
          </div>
        )}

        {/* Category Management (Admin/Editor Only) */}
        {['admin', 'editor'].includes(user.role) && (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Category Management</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><Link to="/admin/categories" className="text-blue-600 hover:underline">Manage Categories</Link></li>
            </ul>
          </div>
        )}

        {/* Media Management (Admin/Editor/Author) */}
        {['admin', 'editor', 'author'].includes(user.role) && (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Media Library</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><Link to="/admin/media" className="text-blue-600 hover:underline">View Media Files</Link></li>
              {/* Optional: Add a direct upload component/page */}
            </ul>
          </div>
        )}

        {/* User Profile */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">My Profile</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><Link to="/profile" className="text-blue-600 hover:underline">Edit Profile</Link></li>
            {/* <li><Link to="/settings" className="text-blue-600 hover:underline">Account Settings</Link></li> */}
          </ul>
        </div>

        {/* Admin Tools (Admin Only) */}
        {user.role === 'admin' && (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Admin Tools</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><Link to="/admin/users" className="text-purple-600 hover:underline">Manage Users</Link></li>
              {/* Add other admin-specific links */}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
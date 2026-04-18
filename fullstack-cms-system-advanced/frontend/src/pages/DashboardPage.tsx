import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user, loading, isAdmin, isEditor } = useAuth();
  useAuthRedirect({ redirectIfUnauthenticatedTo: '/login' });

  if (loading) {
    return <div className="text-center mt-8">Loading dashboard...</div>;
  }

  if (!user) {
    return null; // Should redirect by useAuthRedirect
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to your Dashboard, {user.firstName}!</h1>
      <p className="text-lg text-gray-600 mb-8">Your role: <span className="font-semibold capitalize">{user.role.name}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Content Management Card */}
        {(isAdmin || isEditor) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Content Management</h2>
            <p className="text-gray-700 mb-4">Manage articles, posts, and pages on your CMS.</p>
            <Link to="/dashboard/content">
              <Button>Go to Content</Button>
            </Link>
          </div>
        )}

        {/* Categories Card */}
        {(isAdmin || isEditor) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Categories</h2>
            <p className="text-gray-700 mb-4">Organize your content into logical categories.</p>
            <Link to="/dashboard/categories">
              <Button>Manage Categories</Button>
            </Link>
          </div>
        )}

        {/* Tags Card */}
        {(isAdmin || isEditor) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Tags</h2>
            <p className="text-gray-700 mb-4">Group content by keywords for better discoverability.</p>
            <Link to="/dashboard/tags">
              <Button>Manage Tags</Button>
            </Link>
          </div>
        )}

        {/* User Management Card (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">User Management</h2>
            <p className="text-gray-700 mb-4">Add, edit, or remove users and assign roles.</p>
            <Link to="/dashboard/users">
              <Button>Manage Users</Button>
            </Link>
          </div>
        )}

        {/* Role Management Card (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Role Management</h2>
            <p className="text-gray-700 mb-4">Define and modify user roles and permissions.</p>
            <Link to="/dashboard/roles">
              <Button>Manage Roles</Button>
            </Link>
          </div>
        )}

        {/* Basic Settings Card (Placeholder) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Settings</h2>
          <p className="text-gray-700 mb-4">Configure CMS-wide settings (e.g., general site info).</p>
          <Button variant="secondary" disabled>Go to Settings</Button>
        </div>
      </div>
    </div>
  );
};
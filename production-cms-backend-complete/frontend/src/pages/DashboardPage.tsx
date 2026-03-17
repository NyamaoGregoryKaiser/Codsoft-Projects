import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { UserRole } from '../types';

const DashboardPage: React.FC = () => {
  const { user, loading, error, isAdmin, isEditor } = useAuth();

  if (loading) {
    return <div className="container py-8 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="container py-8 text-center text-red-600">Error: {error}</div>;
  }

  if (!user) {
    return <div className="container py-8 text-center">Please log in to view the dashboard.</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-lg text-gray-700 mb-4">Welcome back, <span className="font-semibold">{user.email}</span>!</p>
      <p className="text-md text-gray-600 mb-8">Your role: <span className="font-medium text-indigo-600">{user.role}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Manage Content"
          description="Create, edit, and publish your articles."
          link="/content"
          icon="📄"
        />
        {(isEditor || isAdmin) && (
          <DashboardCard
            title="Manage Categories"
            description="Organize your content into categories."
            link="/categories"
            icon="🗂️"
          />
        )}
        {isAdmin && (
          <DashboardCard
            title="Manage Users"
            description="View and manage user accounts and roles."
            link="/users"
            icon="👥"
          />
        )}
        <DashboardCard
            title="View Profile"
            description="See your personal information."
            link="/profile"
            icon="👤"
          />
      </div>

      <div className="mt-12 p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
        <h3 className="text-xl font-semibold mb-2">Quick Tips:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Use the "Manage Content" section to start writing.</li>
          <li>Assign relevant categories for better discoverability.</li>
          {isAdmin && <li>As an Admin, you have full control over users and content.</li>}
          {isEditor && !isAdmin && <li>As an Editor, you can manage content and categories.</li>}
        </ul>
      </div>
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  description: string;
  link: string;
  icon: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, link, icon }) => (
  <Link to={link} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <span className="text-3xl">{icon}</span>
    </div>
    <p className="text-gray-700">{description}</p>
  </Link>
);

export default DashboardPage;
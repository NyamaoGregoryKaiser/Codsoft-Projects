```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getDashboards } from '../services/dashboard';
import { Dashboard } from '../utils/types';
import DashboardCard from '../components/dashboards/DashboardCard';

const DashboardsPage: React.FC = () => {
  const { data: dashboards, isLoading, isError, error } = useQuery<Dashboard[]>('dashboards', getDashboards);

  if (isLoading) return <div className="text-center text-lg mt-8">Loading dashboards...</div>;
  if (isError) return <div className="text-center text-red-500 mt-8">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Your Dashboards</h1>
        <Link
          to="/dashboards/new"
          className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300"
        >
          Create New Dashboard
        </Link>
      </div>

      {dashboards && dashboards.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">You haven't created any dashboards yet. Start by creating one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards?.map((dashboard) => (
            <DashboardCard key={dashboard.id} dashboard={dashboard} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardsPage;
```
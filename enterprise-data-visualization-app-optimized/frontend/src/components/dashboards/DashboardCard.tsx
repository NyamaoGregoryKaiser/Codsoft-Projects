```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { deleteDashboard } from '../../services/dashboard';
import { Dashboard } from '../../utils/types';

interface DashboardCardProps {
  dashboard: Dashboard;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ dashboard }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation(() => deleteDashboard(dashboard.id), {
    onSuccess: () => {
      queryClient.invalidateQueries('dashboards'); // Refetch dashboard list
      alert('Dashboard deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to delete dashboard: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${dashboard.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col justify-between h-56 transition-transform transform hover:scale-105">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{dashboard.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{dashboard.description || 'No description provided.'}</p>
      </div>
      <div className="flex justify-end space-x-2">
        <Link
          to={`/dashboards/edit/${dashboard.id}`}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md transition duration-200"
        >
          Edit
        </Link>
        <button
          onClick={() => navigate(`/dashboards/${dashboard.id}`)}
          className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded-md transition duration-200"
        >
          View
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition duration-200"
          disabled={deleteMutation.isLoading}
        >
          {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default DashboardCard;
```
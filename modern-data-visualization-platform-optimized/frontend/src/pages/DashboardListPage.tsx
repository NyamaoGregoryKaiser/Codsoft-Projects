import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { fetchDashboards, createDashboard, deleteDashboard } from '../store/dashboardSlice';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const DashboardListPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboards, loading, error } = useSelector((state: RootState) => state.dashboards);
  const { user } = useSelector((state: RootState) => state.auth);

  const [newDashboardTitle, setNewDashboardTitle] = useState('');

  useEffect(() => {
    dispatch(fetchDashboards());
  }, [dispatch]);

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardTitle.trim()) {
      toast.error('Dashboard title cannot be empty.');
      return;
    }
    if (!user?.id) {
      toast.error('User not logged in.');
      return;
    }

    try {
      const result = await dispatch(createDashboard({
        title: newDashboardTitle,
        description: '', // Optional description
        ownerId: user.id,
      }));
      if (createDashboard.fulfilled.match(result)) {
        toast.success(`Dashboard "${newDashboardTitle}" created!`);
        setNewDashboardTitle('');
        navigate(`/dashboards/${result.payload.id}`);
      } else {
        toast.error(`Failed to create dashboard: ${result.payload}`);
      }
    } catch (err) {
      toast.error('An unexpected error occurred while creating dashboard.');
      console.error(err);
    }
  };

  const handleDeleteDashboard = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete dashboard "${title}"?`)) {
      try {
        const result = await dispatch(deleteDashboard(id));
        if (deleteDashboard.fulfilled.match(result)) {
          toast.success(`Dashboard "${title}" deleted.`);
        } else {
          toast.error(`Failed to delete dashboard: ${result.payload}`);
        }
      } catch (err) {
        toast.error('An unexpected error occurred while deleting dashboard.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center mt-8">Loading dashboards...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Dashboards</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Dashboard</h2>
        <form onSubmit={handleCreateDashboard} className="flex gap-4">
          <input
            type="text"
            placeholder="Dashboard Title"
            value={newDashboardTitle}
            onChange={(e) => setNewDashboardTitle(e.target.value)}
            className="flex-grow border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow"
          >
            Create
          </button>
        </form>
      </div>

      {dashboards.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">You don't have any dashboards yet. Create one above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <div key={dashboard.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
              <div>
                <Link to={`/dashboards/${dashboard.id}`} className="text-xl font-semibold text-blue-700 hover:underline">
                  {dashboard.title}
                </Link>
                <p className="text-gray-600 mt-2 line-clamp-3">{dashboard.description || 'No description provided.'}</p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>Created: {dayjs(dashboard.createdAt).format('MMM D, YYYY h:mm A')}</p>
                <p>Last Updated: {dayjs(dashboard.updatedAt).format('MMM D, YYYY h:mm A')}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link
                  to={`/dashboards/${dashboard.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                >
                  View/Edit
                </Link>
                <button
                  onClick={() => handleDeleteDashboard(dashboard.id!, dashboard.title)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardListPage;
```javascript
import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import moment from 'moment';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalScrapers: 0,
    activeScrapers: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    recentTasks: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch scraper stats
        const scraperRes = await api.get('/scrapers', { params: { skip: 0, limit: 1000 } });
        const totalScrapers = scraperRes.data.total;
        const activeScrapers = scraperRes.data.items.filter(s => s.is_active).length;

        // Fetch task stats
        const tasksRes = await api.get('/tasks', { params: { skip: 0, limit: 1000 } });
        const totalTasks = tasksRes.data.total;
        const completedTasks = tasksRes.data.items.filter(t => t.status === 'COMPLETED').length;
        const failedTasks = tasksRes.data.items.filter(t => t.status === 'FAILED').length;
        
        // Fetch recent tasks for display
        const recentTasksRes = await api.get('/tasks', { params: { skip: 0, limit: 5 } });
        const recentTasks = recentTasksRes.data.items;

        setDashboardData({
          totalScrapers,
          activeScrapers,
          totalTasks,
          completedTasks,
          failedTasks,
          recentTasks,
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard data..." />;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {user?.username}!</h2>
        <p className="text-gray-700">
          This is your control center for managing web scraping tasks. Get started by creating a new scraper, 
          or check the status of your existing tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Scrapers" value={dashboardData.totalScrapers} link="/scrapers" />
        <StatCard title="Active Scrapers" value={dashboardData.activeScrapers} link="/scrapers" />
        <StatCard title="Total Tasks" value={dashboardData.totalTasks} link="/tasks" />
        <StatCard title="Completed Tasks" value={dashboardData.completedTasks} link="/tasks" />
        <StatCard title="Failed Tasks" value={dashboardData.failedTasks} link="/tasks" color="red" />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Scraping Tasks</h2>
        {dashboardData.recentTasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {dashboardData.recentTasks.map((task) => (
              <li key={task.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium text-indigo-600">
                    <Link to={`/tasks?scraper_id=${task.scraper_config_id}`}>{task.config?.name || 'N/A'}</Link>
                  </p>
                  <p className="text-sm text-gray-500">
                    Task ID: {task.id} | Started: {moment(task.start_time).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  task.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  task.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent tasks found. <Link to="/scrapers" className="text-indigo-600 hover:underline">Create a scraper</Link> to get started!</p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, link, color = 'indigo' }) => {
  const bgColorClass = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  }[color];

  return (
    <Link to={link} className="block">
      <div className={`p-5 rounded-lg shadow-md ${bgColorClass} text-white hover:opacity-90 transition-opacity`}>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-3xl font-bold">{value}</div>
      </div>
    </Link>
  );
};

export default Dashboard;
```
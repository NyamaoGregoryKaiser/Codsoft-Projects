```javascript
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowPathIcon, ChartBarSquareIcon, DocumentChartBarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const stats = [
  { id: 1, name: 'Total Datasets', stat: 'N/A', icon: DocumentChartBarIcon, href: '/datasets' },
  { id: 2, name: 'Total ML Models', stat: 'N/A', icon: AcademicCapIcon, href: '/models' },
  { id: 3, name: 'Preprocessed Datasets', stat: 'N/A', icon: ArrowPathIcon, href: '/datasets' },
  { id: 4, name: 'Classification Models', stat: 'N/A', icon: ChartBarSquareIcon, href: '/models' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const datasetsResponse = await api.get('/datasets');
        const modelsResponse = await api.get('/models');

        const totalDatasets = datasetsResponse.data.length;
        const preprocessedDatasets = datasetsResponse.data.filter(d => d.is_preprocessed).length;
        const totalModels = modelsResponse.data.length;
        const classificationModels = modelsResponse.data.filter(m => m.model_type === 'classification').length;

        setDashboardStats(prevStats => prevStats.map(stat => {
          if (stat.id === 1) return { ...stat, stat: totalDatasets };
          if (stat.id === 2) return { ...stat, stat: totalModels };
          if (stat.id === 3) return { ...stat, stat: preprocessedDatasets };
          if (stat.id === 4) return { ...stat, stat: classificationModels };
          return stat;
        }));

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard</h1>
        {user && <p className="mt-2 text-lg text-gray-600">Welcome back, {user.email}!</p>}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <h2 className="text-2xl font-semibold leading-tight text-gray-900 mb-6">Overview</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5 animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-200 rounded-md h-10 w-10"></div>
                  <div className="ml-4 w-full">
                    <div className="text-sm font-medium text-gray-900 h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 h-8 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((item) => (
              <div key={item.id} className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
                <dt>
                  <div className="absolute bg-indigo-500 rounded-md p-3">
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to={item.href} className="font-medium text-indigo-600 hover:text-indigo-500">
                        View all<span className="sr-only"> {item.name} stats</span>
                      </Link>
                    </div>
                  </div>
                </dd>
              </div>
            ))}
          </div>
        )}

        {/* You can add more sections here, e.g., recent activities, quick links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/datasets"
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Upload New Dataset
                </Link>
              </li>
              <li>
                <Link
                  to="/preprocessing"
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Apply Preprocessing
                </Link>
              </li>
              <li>
                <Link
                  to="/models"
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Train New Model
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-gray-500 text-sm">
              <ul className="space-y-2">
                <li><span className="font-medium">Admin@mltoolbox.com</span> uploaded <span className="font-medium">Dummy_Dataset</span>. <span className="text-xs text-gray-400">2 hours ago</span></li>
                <li><span className="font-medium">Admin@mltoolbox.com</span> trained <span className="font-medium">Dummy_LogReg_Model</span>. <span className="text-xs text-gray-400">1 hour ago</span></li>
                {/* More recent activities can be fetched from a dedicated activity log API */}
              </ul>
              <p className="mt-4 text-center text-gray-400">No more recent activities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```
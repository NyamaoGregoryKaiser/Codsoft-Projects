```javascript
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { getDatasets } from '../api/api';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, CubeTransparentIcon, ChartBarIcon } from '@heroicons/react/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [datasetCount, setDatasetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const datasetsRes = await getDatasets();
        setDatasetCount(datasetsRes.data.length);
      } catch (err) {
        console.error('Failed to fetch dashboard counts:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.username}!</h1>

      <Card title="Quick Actions" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/datasets" className="flex flex-col items-center p-4 border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200">
          <DocumentTextIcon className="h-12 w-12 text-blue-500 mb-2" />
          <span className="text-lg font-medium text-gray-800">Manage Datasets</span>
          <p className="text-gray-500 text-sm">Upload, view, and organize your data.</p>
        </Link>
        <Link to="/models" className="flex flex-col items-center p-4 border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200">
          <CubeTransparentIcon className="h-12 w-12 text-green-500 mb-2" />
          <span className="text-lg font-medium text-gray-800">Train Models</span>
          <p className="text-gray-500 text-sm">Build and deploy machine learning models.</p>
        </Link>
        <Link to="/experiments" className="flex flex-col items-center p-4 border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200">
          <ChartBarIcon className="h-12 w-12 text-purple-500 mb-2" />
          <span className="text-lg font-medium text-gray-800">Track Experiments</span>
          <p className="text-gray-500 text-sm">Monitor your model training experiments.</p>
        </Link>
      </Card>

      <Card title="Your ML Resources">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg bg-blue-50 text-blue-800">
            <h3 className="text-lg font-medium">Datasets</h3>
            <p className="text-3xl font-bold">{datasetCount}</p>
            <p>Total datasets uploaded</p>
          </div>
          <div className="p-4 border rounded-lg bg-green-50 text-green-800">
            <h3 className="text-lg font-medium">Models</h3>
            <p className="text-3xl font-bold">0</p> {/* Placeholder */}
            <p>Total models trained</p>
          </div>
          <div className="p-4 border rounded-lg bg-purple-50 text-purple-800">
            <h3 className="text-lg font-medium">Experiments</h3>
            <p className="text-3xl font-bold">0</p> {/* Placeholder */}
            <p>Total experiments run</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
```
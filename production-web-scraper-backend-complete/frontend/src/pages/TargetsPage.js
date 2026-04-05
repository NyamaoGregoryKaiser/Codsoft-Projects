import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const TargetsPage = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/targets');
      setTargets(response.data.rows); // Assuming API returns {count, rows}
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch targets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (targetId) => {
    if (window.confirm('Are you sure you want to delete this target?')) {
      try {
        await apiClient.delete(`/targets/${targetId}`);
        fetchTargets(); // Refresh list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete target.');
        console.error(err);
      }
    }
  };

  const handleRunImmediateScrape = async (targetId) => {
    if (window.confirm('Run an immediate scrape for this target?')) {
      try {
        await apiClient.post(`/scrape-jobs/${targetId}/run`);
        alert('Scrape job enqueued successfully!');
        // Optionally refresh job list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to enqueue scrape job.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center mt-8">Loading targets...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scraping Targets</h1>
        <Link to="/targets/new" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Add New Target
        </Link>
      </div>

      {targets.length === 0 ? (
        <p className="text-center text-gray-600">No targets found. Start by adding a new one!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">URL</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Schedule (Cron)</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {targets.map((target) => (
                <tr key={target.id}>
                  <td className="py-3 px-4">{target.name}</td>
                  <td className="py-3 px-4"><a href={target.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{target.url}</a></td>
                  <td className="py-3 px-4">{target.schedule || 'N/A'}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleRunImmediateScrape(target.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded mr-2"
                    >
                      Run Now
                    </button>
                    <Link
                      to={`/targets/edit/${target.id}`}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded mr-2"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(target.id)}
                      className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TargetsPage;
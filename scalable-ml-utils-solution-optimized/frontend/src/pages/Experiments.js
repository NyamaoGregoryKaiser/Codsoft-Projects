```javascript
import React, { useEffect, useState } from 'react';
import { getExperiments, deleteExperiment } from '../api/api';
import Card from '../components/Card';
import { Link, useSearchParams } from 'react-router-dom';
import { TrashIcon } from '@heroicons/react/outline';

const Experiments = () => {
  const [searchParams] = useSearchParams();
  const filterByModelId = searchParams.get('modelId');

  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExperiments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getExperiments();
      let filteredExperiments = response.data;
      if (filterByModelId) {
        filteredExperiments = response.data.filter(exp => String(exp.model_id) === filterByModelId);
      }
      setExperiments(filteredExperiments);
    } catch (err) {
      console.error('Failed to fetch experiments:', err);
      setError(err.response?.data?.detail || 'Failed to load experiments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [filterByModelId]); // Re-fetch if modelId filter changes

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      try {
        await deleteExperiment(id);
        await fetchExperiments(); // Refresh list
      } catch (err) {
        console.error('Failed to delete experiment:', err);
        setError(err.response?.data?.detail || 'Failed to delete experiment.');
      }
    }
  };

  if (loading) return <div>Loading experiments...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Your Experiments {filterByModelId && `(Model ID: ${filterByModelId})`}</h1>

      <Card title="Existing Experiments">
        {experiments.length === 0 ? (
          <p className="text-gray-600">No experiments found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {experiments.map((experiment) => (
              <li key={experiment.id} className="py-4 flex justify-between items-center">
                <div>
                  <Link to={`/experiments/${experiment.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                    {experiment.name}
                  </Link>
                  <p className="text-sm text-gray-500">Run ID: {experiment.run_id}</p>
                  <p className="text-xs text-gray-400">Model ID: <Link to={`/models/${experiment.model_id}`} className="text-blue-500 hover:underline">{experiment.model_id}</Link></p>
                  <p className={`text-sm font-semibold ${experiment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    Status: {experiment.status}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(experiment.id)}
                  className="btn-danger text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Experiments;
```
```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getExperiment, deleteExperiment } from '../api/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrashIcon } from '@heroicons/react/outline';

const ExperimentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExperimentDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getExperiment(id);
        setExperiment(response.data);
      } catch (err) {
        console.error('Failed to fetch experiment details:', err);
        setError(err.response?.data?.detail || 'Failed to load experiment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExperimentDetails();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      try {
        await deleteExperiment(id);
        navigate('/experiments');
      } catch (err) {
        console.error('Failed to delete experiment:', err);
        setError(err.response?.data?.detail || 'Failed to delete experiment.');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!experiment) return <div className="text-gray-600">Experiment not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{experiment.name}</h1>
        <button onClick={handleDelete} className="btn-danger">
          <TrashIcon className="h-5 w-5 mr-2" /> Delete Experiment
        </button>
      </div>

      <Card title="Experiment Details">
        <p><strong>Run ID:</strong> {experiment.run_id}</p>
        <p><strong>Description:</strong> {experiment.description || 'N/A'}</p>
        <p><strong>Model ID:</strong> {experiment.model_id ? <Link to={`/models/${experiment.model_id}`} className="text-blue-600 hover:underline">{experiment.model_id}</Link> : 'N/A'}</p>
        <p><strong>Status:</strong> <span className={`font-semibold ${experiment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{experiment.status}</span></p>
        <p><strong>Start Time:</strong> {new Date(experiment.created_at).toLocaleDateString()} {new Date(experiment.created_at).toLocaleTimeString()}</p>
      </Card>

      {experiment.hyperparameters && Object.keys(experiment.hyperparameters).length > 0 && (
        <Card title="Hyperparameters">
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(experiment.hyperparameters, null, 2)}
          </pre>
        </Card>
      )}

      {experiment.metrics && Object.keys(experiment.metrics).length > 0 && (
        <Card title="Metrics">
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(experiment.metrics, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default ExperimentDetail;
```
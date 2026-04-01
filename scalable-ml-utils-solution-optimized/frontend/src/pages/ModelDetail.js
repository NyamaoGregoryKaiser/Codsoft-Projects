```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getModel, predict, deleteModel } from '../api/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import { TrashIcon, PlayIcon } from '@heroicons/react/outline';

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [predictionData, setPredictionData] = useState(''); // JSON string for input
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState('');

  useEffect(() => {
    const fetchModelDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const modelRes = await getModel(id);
        setModel(modelRes.data);
      } catch (err) {
        console.error('Failed to fetch model details:', err);
        setError(err.response?.data?.detail || 'Failed to load model details.');
      } finally {
        setLoading(false);
      }
    };

    fetchModelDetails();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this model and all its associated experiments? This action cannot be undone.')) {
      try {
        await deleteModel(id);
        navigate('/models');
      } catch (err) {
        console.error('Failed to delete model:', err);
        setError(err.response?.data?.detail || 'Failed to delete model.');
      }
    }
  };

  const handlePrediction = async (e) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictError('');
    setPredictionResult(null);

    try {
      const parsedData = JSON.parse(predictionData);
      if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item === 'object' && item !== null)) {
        throw new Error("Input data must be an array of objects.");
      }

      const res = await predict(id, parsedData);
      setPredictionResult(res.data);
    } catch (err) {
      console.error('Prediction failed:', err);
      setPredictError(err.response?.data?.detail || err.message || 'Prediction failed. Check your input data format (JSON array of objects).');
    } finally {
      setPredictLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!model) return <div className="text-gray-600">Model not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{model.name}</h1>
        <div className="flex space-x-2">
          <Link to={`/experiments?modelId=${model.id}`} className="btn-secondary">
            View Experiments
          </Link>
          <button onClick={handleDelete} className="btn-danger">
            <TrashIcon className="h-5 w-5 mr-2" /> Delete Model
          </button>
        </div>
      </div>

      <Card title="Model Information">
        <p><strong>Description:</strong> {model.description || 'N/A'}</p>
        <p><strong>Model Type:</strong> {model.model_type}</p>
        <p><strong>Target Column:</strong> {model.target_column}</p>
        <p><strong>Features:</strong> {model.features?.join(', ') || 'N/A'}</p>
        <p><strong>Dataset ID:</strong> {model.dataset_id ? <Link to={`/datasets/${model.dataset_id}`} className="text-blue-600 hover:underline">{model.dataset_id}</Link> : 'N/A'}</p>
        <p><strong>Artifact Path:</strong> {model.artifact_path || 'N/A'}</p>
        <p><strong>Trained On:</strong> {new Date(model.created_at).toLocaleDateString()} {new Date(model.created_at).toLocaleTimeString()}</p>
      </Card>

      <Card title="Make Predictions">
        <p className="text-sm text-gray-600 mb-4">
          Enter JSON data for prediction. For multiple predictions, provide an array of objects.
          Each object should contain values for the model's features: {model.features?.join(', ')}.
        </p>
        <form onSubmit={handlePrediction} className="space-y-4">
          <div>
            <label htmlFor="prediction-data" className="block text-sm font-medium text-gray-700">
              Input Data (JSON)
            </label>
            <textarea
              id="prediction-data"
              className="input-field font-mono text-xs"
              rows="8"
              value={predictionData}
              onChange={(e) => setPredictionData(e.target.value)}
              placeholder={`Example: [\n  { "${model.features?.[0]}": 10, "${model.features?.[1]}": "value" },\n  { ... }\n]`}
              required
            ></textarea>
          </div>
          {predictError && <p className="text-red-500 text-sm">{predictError}</p>}
          <div>
            <button type="submit" className="btn-primary" disabled={predictLoading}>
              {predictLoading ? 'Predicting...' : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" /> Predict
                </>
              )}
            </button>
          </div>
        </form>

        {predictionResult && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Prediction Result:</h3>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
              {JSON.stringify(predictionResult, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModelDetail;
```
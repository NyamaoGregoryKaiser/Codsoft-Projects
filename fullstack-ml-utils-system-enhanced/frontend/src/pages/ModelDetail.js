```javascript
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import PlotlyChart from '../components/PlotlyChart'; // Assuming this component exists

const ModelDetail = () => {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState('[{ }]'); // JSON string input for predictions
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  useEffect(() => {
    const fetchModelDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/models/${id}`);
        setModel(response.data);
      } catch (err) {
        console.error("Failed to fetch model details:", err);
        setError(err.response?.data?.detail || "Failed to load model details.");
        toast.error(err.response?.data?.detail || "Failed to load model details.");
      } finally {
        setLoading(false);
      }
    };

    fetchModelDetails();
  }, [id]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredictionResult(null);
    setPredictionError(null);
    setIsPredicting(true);

    try {
      const data = JSON.parse(predictionData);
      if (!Array.isArray(data) || data.some(item => typeof item !== 'object' || item === null)) {
        throw new Error("Input data must be an array of JSON objects.");
      }

      const response = await api.post('/predictions/', {
        model_id: model.id,
        data: data,
      });
      setPredictionResult(response.data.predictions);
      toast.success("Predictions generated successfully!");
    } catch (err) {
      console.error("Prediction failed:", err);
      setPredictionError(err.response?.data?.detail || err.message || "An error occurred during prediction.");
      toast.error(err.response?.data?.detail || err.message || "Prediction failed.");
    } finally {
      setIsPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 text-lg mt-10">{error}</div>;
  }

  if (!model) {
    return <div className="text-center text-gray-500 text-lg mt-10">ML Model not found.</div>;
  }

  // Example plot for classification metrics (e.g., bar chart for accuracy, precision, recall, F1)
  const renderMetricsChart = () => {
    if (!model.metrics || Object.keys(model.metrics).length === 0) {
      return <p className="text-gray-500 text-sm">No metrics available for visualization.</p>;
    }

    const metricNames = Object.keys(model.metrics);
    const metricValues = Object.values(model.metrics);

    const data = [
      {
        x: metricNames,
        y: metricValues,
        type: 'bar',
        marker: { color: model.model_type === 'classification' ? '#4CAF50' : '#2196F3' }, // Green for classification, blue for regression
      },
    ];

    const layout = {
      title: 'Model Evaluation Metrics',
      xaxis: { title: 'Metric' },
      yaxis: { title: 'Value', range: [0, model.model_type === 'classification' ? 1 : undefined] },
      margin: { t: 50, b: 50, l: 50, r: 50 },
    };

    return <PlotlyChart data={data} layout={layout} style={{ height: '350px' }} />;
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/models" className="inline-flex items-center text-indigo-600 hover:text-indigo-900 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Models
        </Link>
        <h1 className="text-3xl font-bold leading-tight text-gray-900">{model.name}</h1>
        <p className="mt-2 text-gray-700">{model.description || "No description provided."}</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Model Details</h3>
            <p className="text-sm text-gray-700"><strong>ID:</strong> {model.id}</p>
            <p className="text-sm text-gray-700"><strong>Owner:</strong> {model.owner_id}</p>
            <p className="text-sm text-gray-700"><strong>Dataset ID:</strong> <Link to={`/datasets/${model.dataset_id}`} className="text-blue-600 hover:underline">{model.dataset_id}</Link></p>
            <p className="text-sm text-gray-700"><strong>Model Type:</strong> {model.model_type.toUpperCase()}</p>
            <p className="text-sm text-gray-700"><strong>Algorithm:</strong> {model.algorithm.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-sm text-gray-700"><strong>Target Column:</strong> {model.target_column}</p>
            <p className="text-sm text-gray-700"><strong>Features:</strong> {model.features.join(', ')}</p>
            <p className="text-sm text-gray-700"><strong>Created:</strong> {dayjs(model.created_at).format('YYYY-MM-DD HH:mm')}</p>
            <p className="text-sm text-gray-700"><strong>Updated:</strong> {dayjs(model.updated_at).format('YYYY-MM-DD HH:mm')}</p>
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Hyperparameters</h3>
            {model.hyperparameters && Object.keys(model.hyperparameters).length > 0 ? (
              <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(model.hyperparameters, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-500">No hyperparameters configured.</p>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Evaluation Metrics</h3>
            {model.metrics && Object.keys(model.metrics).length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {Object.entries(model.metrics).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key.replace(/_/g, ' ').toCapitalCase()}:</strong> {typeof value === 'number' ? value.toFixed(4) : value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No metrics available.</p>
            )}
            <div className="mt-4">
              {renderMetricsChart()}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <CubeTransparentIcon className="h-6 w-6 mr-2 text-indigo-600" /> Make Predictions
          </h2>
          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label htmlFor="prediction-input" className="block text-sm font-medium text-gray-700">
                Input Data (JSON Array of Objects)
              </label>
              <textarea
                id="prediction-input"
                rows="8"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                value={predictionData}
                onChange={(e) => setPredictionData(e.target.value)}
                placeholder={`[{"feature_a": 0.5, "feature_b": 7}, {"feature_a": 0.9, "feature_b": 3}]`}
                required
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Enter new data as a JSON array where each object represents a single instance with feature values.
                Example for model trained on `feature_a` and `feature_b`.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Get Predictions
              </button>
            </div>
          </form>

          {predictionResult && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Prediction Results:</h3>
              <pre className="bg-gray-100 p-3 rounded-md text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(predictionResult, null, 2)}
              </pre>
            </div>
          )}

          {predictionError && (
            <div className="mt-6 text-red-600">
              <p className="font-medium">Error during prediction:</p>
              <pre className="bg-red-50 p-3 rounded-md text-sm font-mono whitespace-pre-wrap">
                {predictionError}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to capitalize first letter of each word (if not already defined)
if (!String.prototype.toCapitalCase) {
  String.prototype.toCapitalCase = function() {
    return this.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
}

export default ModelDetail;
```
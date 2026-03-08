```javascript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { alertApi } from '../api';
import useAuth from '../hooks/useAuth';

const AlertForm = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projectId, alertId } = useParams(); // alertId will be undefined for new alerts
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [metricType, setMetricType] = useState('http_request');
  const [aggregationType, setAggregationType] = useState('avg');
  const [field, setField] = useState('');
  const [operator, setOperator] = useState('>');
  const [threshold, setThreshold] = useState('');
  const [timeWindowMinutes, setTimeWindowMinutes] = useState('5');
  const [isEnabled, setIsEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !projectId) {
      if (!isAuthenticated) return;
      // If no project is selected and we're trying to create an alert
      navigate('/projects'); // Redirect to projects if no project in context
      return;
    }

    if (alertId) {
      setIsEditing(true);
      const fetchAlert = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await alertApi.getAlert(projectId, alertId);
          const alert = response.data;
          setName(alert.name);
          setMetricType(alert.metric_type);
          setAggregationType(alert.aggregation_type);
          setField(alert.field);
          setOperator(alert.operator);
          setThreshold(alert.threshold);
          setTimeWindowMinutes(alert.time_window_minutes);
          setIsEnabled(alert.is_enabled);
        } catch (err) {
          console.error('Failed to fetch alert:', err);
          setError('Failed to load alert details.');
        } finally {
          setLoading(false);
        }
      };
      fetchAlert();
    } else {
      setIsEditing(false);
      setLoading(false);
    }
  }, [isAuthenticated, projectId, alertId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const alertData = {
        name,
        metricType,
        aggregationType,
        field,
        operator,
        threshold: parseFloat(threshold),
        timeWindowMinutes: parseInt(timeWindowMinutes, 10),
        isEnabled,
      };

      if (isEditing) {
        await alertApi.updateAlert(projectId, alertId, alertData);
      } else {
        await alertApi.createAlert(projectId, alertData);
      }
      navigate(`/projects/${projectId}/alerts`); // Redirect to alerts list for the project
    } catch (err) {
      console.error('Failed to save alert:', err);
      setError(err.response?.data?.message || 'Failed to save alert.');
    }
  };

  if (authLoading || loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 border rounded-lg shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isEditing ? 'Edit Alert' : 'Create New Alert'}
      </h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Alert Name:
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="metricType" className="block text-gray-700 text-sm font-bold mb-2">
            Metric Type:
          </label>
          <select
            id="metricType"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            required
          >
            <option value="http_request">HTTP Request</option>
            <option value="resource_usage">Resource Usage</option>
            <option value="error">Error</option>
            <option value="custom_event">Custom Event</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="field" className="block text-gray-700 text-sm font-bold mb-2">
            Field to Monitor (e.g., durationMs, count, status):
          </label>
          <input
            type="text"
            id="field"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g., durationMs for http_request"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="aggregationType" className="block text-gray-700 text-sm font-bold mb-2">
            Aggregation Type:
          </label>
          <select
            id="aggregationType"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={aggregationType}
            onChange={(e) => setAggregationType(e.target.value)}
            required
          >
            <option value="avg">Average</option>
            <option value="sum">Sum</option>
            <option value="count">Count</option>
            <option value="max">Max</option>
            <option value="min">Min</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="operator" className="block text-gray-700 text-sm font-bold mb-2">
            Operator:
          </label>
          <select
            id="operator"
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            required
          >
            <option value=">">Greater Than (&gt;)</option>
            <option value="<">Less Than (&lt;)</option>
            <option value="=">Equals (=)</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="threshold" className="block text-gray-700 text-sm font-bold mb-2">
            Threshold:
          </label>
          <input
            type="number"
            id="threshold"
            step="any"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="timeWindowMinutes" className="block text-gray-700 text-sm font-bold mb-2">
            Time Window (Minutes):
          </label>
          <input
            type="number"
            id="timeWindowMinutes"
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={timeWindowMinutes}
            onChange={(e) => setTimeWindowMinutes(e.target.value)}
            required
          />
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="isEnabled"
            className="mr-2 leading-tight"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          <label htmlFor="isEnabled" className="text-sm text-gray-700">
            Enable Alert
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            {isEditing ? 'Save Changes' : 'Create Alert'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlertForm;
```
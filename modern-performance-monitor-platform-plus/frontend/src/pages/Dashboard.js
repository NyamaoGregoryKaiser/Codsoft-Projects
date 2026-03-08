```javascript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { metricApi } from '../api';
import LineChart from '../components/charts/LineChart';
import useAuth from '../hooks/useAuth';
import moment from 'moment';

const Dashboard = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projectId } = useParams();
  const [httpRequests, setHttpRequests] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = moment();
      const oneHourAgo = moment().subtract(1, 'hour');

      // Fetch aggregated HTTP request duration (average)
      const httpReqAggregated = await metricApi.getAggregatedMetrics(projectId, {
        metricType: 'http_request',
        field: 'durationMs',
        aggregationType: 'avg',
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString(),
        interval: 'minute',
      });
      setHttpRequests(httpReqAggregated.data.map(m => ({
        label: moment(m.interval_start).format('HH:mm'),
        value: parseFloat(m.value).toFixed(2)
      })));

      // Fetch aggregated Error count
      const errorAggregated = await metricApi.getAggregatedMetrics(projectId, {
        metricType: 'error',
        field: 'message', // Can be any field for counting
        aggregationType: 'count',
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString(),
        interval: 'minute',
      });
      setErrors(errorAggregated.data.map(m => ({
        label: moment(m.interval_start).format('HH:mm'),
        value: parseInt(m.value, 10)
      })));

    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, projectId]);

  if (authLoading || loading) {
    return <div className="text-center mt-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Project Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LineChart
          data={httpRequests}
          title="Average HTTP Request Duration (ms)"
          xAxisLabel="Time"
          yAxisLabel="Duration (ms)"
        />
        <LineChart
          data={errors}
          title="Error Count"
          xAxisLabel="Time"
          yAxisLabel="Count"
        />
        {/* Add more charts as needed for different metric types */}
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800">Recent Metrics (Conceptual, would be raw data)</h2>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-600">This section would typically display a table or list of recent raw metric data,
          allowing drill-down into specific events or logs. For brevity, displaying conceptual text.</p>
        {/*
        Implement a table to show latest raw metrics using metricApi.getMetrics
        Example:
        {rawMetrics.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rawMetrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{metric.metric_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(metric.timestamp).format('YYYY-MM-DD HH:mm:ss')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{JSON.stringify(metric.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No recent raw metrics to display.</p>
        )}
        */}
      </div>
    </div>
  );
};

export default Dashboard;
```
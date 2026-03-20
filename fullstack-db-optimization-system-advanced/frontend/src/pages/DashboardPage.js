import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { dbOptimizerApi } from '../api';
import useAuth from '../hooks/useAuth';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState({
    slowQueriesCount: 0,
    indexSuggestionsCount: 0,
    schemaIssuesCount: 0,
    latestMetrics: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      try {
        const [
          slowQueriesRes,
          indexSuggestionsRes,
          schemaIssuesRes,
          latestMetricsRes
        ] = await Promise.all([
          dbOptimizerApi.getSlowQueries(null, { pageSize: 1, minDuration: 500 }), // Get count for any instance with minDuration > 500ms
          dbOptimizerApi.getIndexSuggestions(null, { status: 'pending' }),
          dbOptimizerApi.getSchemaIssues(null, { status: 'open', severity: 'high' }),
          dbOptimizerApi.getLatestMetrics(),
        ]);

        setSummaryData({
          slowQueriesCount: slowQueriesRes.data.pagination.total,
          indexSuggestionsCount: indexSuggestionsRes.data.length,
          schemaIssuesCount: schemaIssuesRes.data.length,
          latestMetrics: latestMetricsRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
        toast.error('Failed to load dashboard data. See console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto mt-8 p-4 text-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold mb-8 text-dark">Welcome, {user?.username}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card title="New Slow Queries (Last 24h)" className="bg-red-500 text-white">
          <p className="text-5xl font-bold">{summaryData.slowQueriesCount}</p>
          <Link to="/slow-queries" className="block mt-4 text-white hover:underline">View Details &rarr;</Link>
        </Card>

        <Card title="Pending Index Suggestions" className="bg-primary text-white">
          <p className="text-5xl font-bold">{summaryData.indexSuggestionsCount}</p>
          <Link to="/index-suggestions" className="block mt-4 text-white hover:underline">Review Suggestions &rarr;</Link>
        </Card>

        <Card title="Open High-Severity Schema Issues" className="bg-yellow-500 text-white">
          <p className="text-5xl font-bold">{summaryData.schemaIssuesCount}</p>
          <Link to="/schema-analysis" className="block mt-4 text-white hover:underline">Address Issues &rarr;</Link>
        </Card>
      </div>

      <Card title="Latest Database Metrics" className="mb-8">
        {summaryData.latestMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Timestamp:</p>
              <p className="text-lg font-semibold">{dayjs(summaryData.latestMetrics.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CPU Usage:</p>
              <p className="text-lg font-semibold">{summaryData.latestMetrics.cpuUsage}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Memory Usage:</p>
              <p className="text-lg font-semibold">{summaryData.latestMetrics.memoryUsage} MB</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Connections:</p>
              <p className="text-lg font-semibold">{summaryData.latestMetrics.activeConnections}</p>
            </div>
            {/* Add more metrics as needed */}
          </div>
        ) : (
          <p>No latest metrics available. Ensure data collection is running.</p>
        )}
        <Link to="/metrics" className="block mt-4 text-primary hover:underline">View Full Metrics &rarr;</Link>
      </Card>

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-4">
          <Link to="/slow-queries" className="btn-primary">Analyze Slow Queries</Link>
          <Link to="/index-suggestions" className="btn-secondary">Check Index Suggestions</Link>
          <Link to="/schema-analysis" className="btn-primary">Review Schema Issues</Link>
          <Link to="/metrics" className="btn-secondary">Monitor DB Health</Link>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
```

#### `frontend/src/pages/SlowQueriesPage.js`
```javascript
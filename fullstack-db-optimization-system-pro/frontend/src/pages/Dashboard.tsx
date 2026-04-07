import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { databasesApi } from '@api/databases';
import { metricsApi } from '@api/metrics';
import ChartComponent from '@components/ChartComponent';
import { MetricChartData } from '@types';
import { useAuth } from '@hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch databases
  const { data: databases, isLoading: isLoadingDatabases, error: errorDatabases } = useQuery({
    queryKey: ['databases'],
    queryFn: databasesApi.getDatabases,
  });

  // Fetch metrics for the *first* database (for demo purposes)
  const firstDbId = databases?.[0]?.id;
  const { data: metrics, isLoading: isLoadingMetrics, error: errorMetrics } = useQuery({
    queryKey: ['metrics', firstDbId],
    queryFn: () => metricsApi.getMetricsByDatabaseId(firstDbId!),
    enabled: !!firstDbId, // Only run if firstDbId is available
  });

  const prepareChartData = (metrics: any[] | undefined): MetricChartData => {
    if (!metrics || metrics.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sort metrics by timestamp ascending for chart
    const sortedMetrics = [...metrics].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      labels: sortedMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: sortedMetrics.map(m => m.cpuUsagePercent),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Memory Usage (%)',
          data: sortedMetrics.map(m => m.memoryUsagePercent),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Avg Query Latency (ms)',
          data: sortedMetrics.map(m => m.avgQueryLatencyMs),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          fill: false, // Don't fill for latency to highlight spikes
          tension: 0.4
        }
      ],
    };
  };

  const chartData = prepareChartData(metrics);

  if (isLoadingDatabases || isLoadingMetrics) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
      Loading dashboard...
    </div>
  );
  if (errorDatabases || errorMetrics) return <div className="p-4 text-red-600">Error: {errorDatabases?.message || errorMetrics?.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to DBOptiFlow, {user?.username}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Databases</h2>
          <p className="text-4xl font-bold text-indigo-600">{databases?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Active Tasks</h2>
          <p className="text-4xl font-bold text-orange-500">5</p> {/* Placeholder */}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Pending Suggestions</h2>
          <p className="text-4xl font-bold text-green-600">7</p> {/* Placeholder */}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md h-[500px] mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Performance Overview ({databases?.[0]?.name || 'N/A'})</h2>
        {firstDbId ? (
          <ChartComponent data={chartData} title="Recent Performance Metrics" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            No database selected or no metrics available to display chart.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-gray-700">
              <span>Optimized index on <strong>orders</strong> table.</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </li>
            <li className="flex justify-between items-center text-gray-700">
              <span>New slow query detected on <strong>users</strong> table.</span>
              <span className="text-sm text-gray-500">1 day ago</span>
            </li>
            <li className="flex justify-between items-center text-gray-700">
              <span>Added database <strong>Dev_Analytics</strong>.</span>
              <span className="text-sm text-gray-500">3 days ago</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Top 3 Slowest Queries (Last 24h)</h2>
          <ul className="space-y-3">
            <li className="text-gray-700"><code>SELECT * FROM customers WHERE name LIKE '%John%';</code></li>
            <li className="text-gray-700"><code>UPDATE products SET stock = stock - 1 WHERE id = 123;</code></li>
            <li className="text-gray-700"><code>SELECT sum(amount) FROM transactions WHERE date > '2023-01-01' GROUP BY user_id;</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState } from 'react';
import { dbOptimizerApi } from '../api';
import Card from '../components/Card';
import MetricChart from '../components/MetricChart';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

const MetricsPage = () => {
  const [metricHistory, setMetricHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d'

  const fetchMetricHistory = async () => {
    setLoading(true);
    let startDate;
    const endDate = dayjs();

    switch (timeRange) {
      case '24h':
        startDate = endDate.subtract(24, 'hour');
        break;
      case '7d':
        startDate = endDate.subtract(7, 'day');
        break;
      case '30d':
        startDate = endDate.subtract(30, 'day');
        break;
      default:
        startDate = endDate.subtract(24, 'hour');
    }

    try {
      const res = await dbOptimizerApi.getMetricHistory(null, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100, // Max 100 data points for chart
      });
      setMetricHistory(res.data.data);
    } catch (error) {
      console.error("Error fetching metric history:", error);
      toast.error('Failed to fetch metric history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricHistory();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="container mx-auto mt-8 p-4 text-center text-gray-600">
        Loading metrics...
      </div>
    );
  }

  const timestamps = metricHistory.map(m => m.timestamp);

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold mb-6 text-dark">Database Performance Metrics</h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Time Range</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setTimeRange('24h')}
            className={`btn-primary ${timeRange === '24h' ? 'bg-primary' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`btn-primary ${timeRange === '7d' ? 'bg-primary' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`btn-primary ${timeRange === '30d' ? 'bg-primary' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            Last 30 Days
          </button>
        </div>
      </Card>

      {metricHistory.length === 0 ? (
        <Card>
          <p className="text-center py-4 text-gray-600">No metric data available for the selected period.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <MetricChart
              title="CPU Usage"
              data={metricHistory}
              labels={timestamps}
              metricKey="cpuUsage"
              unit="%"
              color="#F59E0B" // Amber
            />
          </Card>
          <Card>
            <MetricChart
              title="Memory Usage"
              data={metricHistory}
              labels={timestamps}
              metricKey="memoryUsage"
              unit=" MB"
              color="#EF4444" // Red
            />
          </Card>
          <Card>
            <MetricChart
              title="Active Connections"
              data={metricHistory}
              labels={timestamps}
              metricKey="activeConnections"
              unit=""
              color="#10B981" // Green
            />
          </Card>
          <Card>
            <MetricChart
              title="Transactions/Sec"
              data={metricHistory}
              labels={timestamps}
              metricKey="transactionsPerSec"
              unit=""
              color="#6366F1" // Indigo
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default MetricsPage;
```

#### `frontend/src/App.js`
```javascript
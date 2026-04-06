import React, { useState, useEffect, useRef } from 'react';
import * as dashboardApi from '../../api/dashboard';
import LoadingSpinner from '../Common/LoadingSpinner';
import MetricChart from '../Dashboard/MetricChart';
import '../../styles/metrics.css';

const MonitoredDbMetrics = ({ dbConnectionId, isMonitoringActive }) => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState('24h');
  const intervalRef = useRef(null);

  const fetchMetrics = async (period) => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardApi.getConnectionMetrics(dbConnectionId, period);
      setMetrics(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(timePeriod); // Initial fetch

    if (isMonitoringActive) {
      // Set up auto-refresh
      intervalRef.current = setInterval(() => {
        fetchMetrics(timePeriod);
      }, 60000); // Refresh every 1 minute
    }

    // Cleanup interval on component unmount or when monitoring stops/changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dbConnectionId, timePeriod, isMonitoringActive]);

  const chartLabels = metrics.map(m => new Date(m.timestamp).toLocaleTimeString());
  const connectionData = metrics.map(m => m.connections?.find(c => c.state === 'active')?.count || 0);
  const idleConnectionData = metrics.map(m => m.connections?.find(c => c.state === 'idle')?.count || 0);
  const slowQueryData = metrics.map(m => m.slowQueriesCount || 0);
  // Example for database size: assuming size_bytes is collected and parsed
  // Note: pg_database_size returns total size, not a trend usually
  const latestDbSize = metrics.length > 0 ? metrics[metrics.length - 1].databaseSize : 'N/A';


  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!isMonitoringActive) {
    return <p className="info-message">Monitoring is currently inactive for this database. Start monitoring to see metrics.</p>;
  }

  if (metrics.length === 0) {
    return <p className="info-message">No metrics collected yet for this database. Please wait for the first monitoring cycle.</p>;
  }

  return (
    <div className="monitored-db-metrics">
      <h3>Live Metrics & Trends</h3>
      <div className="metrics-controls">
        <label htmlFor="timePeriod">Time Period:</label>
        <select id="timePeriod" value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)}>
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
        <span className="current-db-size">Latest DB Size: {latestDbSize}</span>
      </div>
      <div className="metrics-charts-grid">
        <MetricChart
          title="Active Connections"
          labels={chartLabels}
          dataPoints={connectionData}
          dataLabel="Active Connections"
          unit="Connections"
        />
        <MetricChart
          title="Idle Connections"
          labels={chartLabels}
          dataPoints={idleConnectionData}
          dataLabel="Idle Connections"
          unit="Connections"
        />
        <MetricChart
          title="Slow Queries Detected"
          labels={chartLabels}
          dataPoints={slowQueryData}
          dataLabel="Slow Queries"
          unit="Count"
        />
        {/* Add more charts for other metrics like CPU usage, memory, disk I/O if collected */}
      </div>

      {/* Optionally display raw latest metrics */}
      <div className="latest-raw-metrics card">
        <h3>Latest Raw Metrics</h3>
        {metrics.length > 0 && (
          <pre>{JSON.stringify(metrics[metrics.length - 1], null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

export default MonitoredDbMetrics;
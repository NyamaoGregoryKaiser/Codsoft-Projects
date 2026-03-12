```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getApplicationById, getMetricsForApp, getAlertsForApp, createAlertForApp, updateAlert, deleteAlert } from '../api';
import MetricChart from '../components/MetricChart';
import { toast } from 'react-toastify';
import './AppDetail.css';

const metricOptions = [
  { value: 'cpu', label: 'CPU Usage', color: '#8884d8' },
  { value: 'memory', label: 'Memory Usage', color: '#82ca9d' },
  { value: 'request_latency', label: 'Request Latency', color: '#ffc658' },
  { value: 'error_rate', label: 'Error Rate', color: '#ff7300' },
];

const periodOptions = [
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

const operatorOptions = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '=', label: '=' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'triggered', label: 'Triggered' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'disabled', label: 'Disabled' },
];

const AppDetail = () => {
  const { appId } = useParams();
  const [application, setApplication] = useState(null);
  const [metricsData, setMetricsData] = useState({}); // { cpu: [], memory: [] }
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('24h');

  // State for new alert form
  const [newAlert, setNewAlert] = useState({
    metricType: 'cpu',
    thresholdValue: '',
    operator: '>',
    message: '',
  });

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const appResponse = await getApplicationById(appId);
      setApplication(appResponse.data.data);

      const fetchedMetrics = {};
      for (const metric of metricOptions) {
        const metricResponse = await getMetricsForApp(appId, metric.value, selectedPeriod);
        fetchedMetrics[metric.value] = metricResponse.data.data;
      }
      setMetricsData(fetchedMetrics);

      const alertsResponse = await getAlertsForApp(appId);
      setAlerts(alertsResponse.data.data);

    } catch (err) {
      console.error('Failed to fetch application details or metrics:', err);
      setError('Failed to load application data. Please ensure the application exists and you have permission.');
      toast.error('Failed to load application data.');
    } finally {
      setLoading(false);
    }
  }, [appId, selectedPeriod]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  const handleAlertFormChange = (e) => {
    const { name, value } = e.target;
    setNewAlert((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      if (!newAlert.thresholdValue || isNaN(newAlert.thresholdValue)) {
        toast.error('Threshold value must be a number.');
        return;
      }
      const response = await createAlertForApp(appId, {
        ...newAlert,
        thresholdValue: parseFloat(newAlert.thresholdValue),
      });
      setAlerts((prev) => [...prev, response.data.data]);
      setNewAlert({ metricType: 'cpu', thresholdValue: '', operator: '>', message: '' }); // Reset form
      toast.success('Alert created successfully!');
    } catch (err) {
      console.error('Error creating alert:', err);
      toast.error(`Failed to create alert: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleUpdateAlertStatus = async (alertId, newStatus) => {
    try {
      const response = await updateAlert(alertId, { status: newStatus });
      setAlerts((prev) => prev.map(a => a.id === alertId ? response.data.data : a));
      toast.success('Alert status updated.');
    } catch (err) {
      console.error('Error updating alert:', err);
      toast.error(`Failed to update alert: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteAlert(alertId);
        setAlerts((prev) => prev.filter(a => a.id !== alertId));
        toast.success('Alert deleted successfully.');
      } catch (err) {
        console.error('Error deleting alert:', err);
        toast.error(`Failed to delete alert: ${err.response?.data?.message || err.message}`);
      }
    }
  };


  if (loading) {
    return <div className="app-detail-loading">Loading application details...</div>;
  }

  if (error) {
    return <div className="app-detail-error">{error}</div>;
  }

  if (!application) {
    return <div className="app-detail-error">Application not found.</div>;
  }

  return (
    <div className="app-detail-container">
      <h1 className="app-detail-title">{application.name}</h1>
      <p className="app-detail-description">{application.description}</p>
      <div className="app-api-key">
        <strong>API Key:</strong> <code>{application.apiKey}</code>
        <button onClick={() => navigator.clipboard.writeText(application.apiKey)} className="copy-button">Copy</button>
      </div>

      <div className="chart-controls">
        <label htmlFor="period-select">Time Period:</label>
        <select id="period-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <section className="metrics-section">
        <h2>Performance Metrics</h2>
        <div className="metrics-grid">
          {metricOptions.map((metric) => (
            <MetricChart
              key={metric.value}
              data={metricsData[metric.value]}
              metricType={metric.value}
              title={metric.label}
              color={metric.color}
            />
          ))}
        </div>
      </section>

      <section className="alerts-section">
        <h2>Alerts</h2>
        <div className="create-alert-form-container">
          <h3>Create New Alert</h3>
          <form onSubmit={handleCreateAlert} className="create-alert-form">
            <div className="form-group">
              <label htmlFor="metricType">Metric:</label>
              <select name="metricType" id="metricType" value={newAlert.metricType} onChange={handleAlertFormChange} required>
                {metricOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="operator">Operator:</label>
              <select name="operator" id="operator" value={newAlert.operator} onChange={handleAlertFormChange} required>
                {operatorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="thresholdValue">Threshold Value:</label>
              <input type="number" name="thresholdValue" id="thresholdValue" value={newAlert.thresholdValue} onChange={handleAlertFormChange} step="any" required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message (Optional):</label>
              <textarea name="message" id="message" value={newAlert.message} onChange={handleAlertFormChange} rows="2"></textarea>
            </div>
            <button type="submit" className="create-alert-button">Create Alert</button>
          </form>
        </div>

        {alerts.length === 0 ? (
          <p className="no-alerts">No alerts configured for this application.</p>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item status-${alert.status}`}>
                <div className="alert-header">
                  <strong>{alert.message || `Alert for ${alert.metricType} ${alert.operator} ${alert.thresholdValue}`}</strong>
                  <span className={`alert-status ${alert.status}`}>{alert.status}</span>
                </div>
                <div className="alert-details">
                  <p>Metric: {metricOptions.find(m => m.value === alert.metricType)?.label || alert.metricType}</p>
                  <p>Threshold: {alert.operator} {alert.thresholdValue}</p>
                  {alert.triggeredAt && <p>Triggered At: {new Date(alert.triggeredAt).toLocaleString()}</p>}
                  {alert.resolvedAt && <p>Resolved At: {new Date(alert.resolvedAt).toLocaleString()}</p>}
                  <p>Created At: {new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                <div className="alert-actions">
                  <select
                    value={alert.status}
                    onChange={(e) => handleUpdateAlertStatus(alert.id, e.target.value)}
                    className={`alert-status-select ${alert.status}`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button onClick={() => handleDeleteAlert(alert.id)} className="delete-alert-button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AppDetail;
```
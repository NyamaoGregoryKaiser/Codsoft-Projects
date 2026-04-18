```typescript jsx
import React, { useState, useEffect } from 'react';
import { getAllAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, AlertRule, getAllServices, Service } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for creating/editing rules
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentRule, setCurrentRule] = useState<Partial<AlertRule>>({
    name: '',
    metric_type: 'CPU_USAGE', // Default
    threshold: 0,
    operator: '>', // Default
    duration_seconds: 60,
    target_email: '',
    service_id: undefined, // For specific service or global
    status: 'active'
  });

  const metricTypes = ['CPU_USAGE', 'MEMORY_USAGE', 'REQUEST_LATENCY', 'ERROR_RATE', 'CUSTOM_METRIC'];
  const operators = ['>', '<', '>=', '<=', '='];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rules, servicesData] = await Promise.all([
        getAllAlertRules(),
        getAllServices()
      ]);
      setAlertRules(rules);
      setServices(servicesData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentRule(prev => ({
      ...prev,
      [name]: name === 'threshold' || name === 'duration_seconds' || name === 'service_id' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditing && currentRule.id) {
        await updateAlertRule(currentRule.id, currentRule);
        setSuccessMessage('Alert rule updated successfully!');
      } else {
        await createAlertRule(currentRule);
        setSuccessMessage('Alert rule created successfully!');
      }
      resetForm();
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save alert rule.');
    }
  };

  const handleEdit = (rule: AlertRule) => {
    setCurrentRule(rule);
    setIsEditing(true);
  };

  const handleDelete = async (ruleId: number) => {
    if (!window.confirm('Are you sure you want to delete this alert rule?')) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteAlertRule(ruleId);
      setSuccessMessage('Alert rule deleted successfully!');
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete alert rule.');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentRule({
      name: '',
      metric_type: 'CPU_USAGE',
      threshold: 0,
      operator: '>',
      duration_seconds: 60,
      target_email: '',
      service_id: undefined,
      status: 'active'
    });
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <main>
      <h2>Alert Rules Management</h2>

      {user?.role === 'admin' && (
        <div className="card mb-20">
          <h3>{isEditing ? 'Edit Alert Rule' : 'Create New Alert Rule'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Rule Name:</label>
              <input type="text" id="name" name="name" value={currentRule.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="service_id">Service:</label>
              <select id="service_id" name="service_id" value={currentRule.service_id || ''} onChange={handleInputChange}>
                <option value="">Global Rule (All Services)</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="metric_type">Metric Type:</label>
              <select id="metric_type" name="metric_type" value={currentRule.metric_type || ''} onChange={handleInputChange} required>
                {metricTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="operator">Operator:</label>
              <select id="operator" name="operator" value={currentRule.operator || ''} onChange={handleInputChange} required>
                {operators.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="threshold">Threshold Value:</label>
              <input type="number" id="threshold" name="threshold" value={currentRule.threshold || 0} onChange={handleInputChange} required step="0.01" />
            </div>
            <div className="form-group">
              <label htmlFor="duration_seconds">Duration (seconds):</label>
              <input type="number" id="duration_seconds" name="duration_seconds" value={currentRule.duration_seconds || 60} onChange={handleInputChange} required min="1" />
            </div>
            <div className="form-group">
              <label htmlFor="target_email">Target Email for Alerts:</label>
              <input type="email" id="target_email" name="target_email" value={currentRule.target_email || ''} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select id="status" name="status" value={currentRule.status || 'active'} onChange={handleInputChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <div className="flex-container" style={{ justifyContent: 'flex-start', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">
                {isEditing ? 'Update Rule' : 'Create Rule'}
                </button>
                {isEditing && (
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                    Cancel Edit
                </button>
                )}
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Current Alert Rules</h3>
        {alertRules.length === 0 ? (
          <p className="app-alert app-alert-info">No alert rules configured yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Service</th>
                <th>Metric</th>
                <th>Condition</th>
                <th>Duration</th>
                <th>Target Email</th>
                <th>Status</th>
                {user?.role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {alertRules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.id}</td>
                  <td>{rule.name}</td>
                  <td>{rule.service_id ? (services.find(s => s.id === rule.service_id)?.name || 'N/A') : 'Global'}</td>
                  <td>{rule.metric_type.replace(/_/g, ' ')}</td>
                  <td>{rule.operator} {rule.threshold}</td>
                  <td>{rule.duration_seconds}s</td>
                  <td>{rule.target_email || 'N/A'}</td>
                  <td>{rule.status}</td>
                  {user?.role === 'admin' && (
                    <td>
                      <button onClick={() => handleEdit(rule)} className="btn btn-secondary" style={{ marginRight: '5px' }}>Edit</button>
                      <button onClick={() => handleDelete(rule.id)} className="btn btn-danger">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
};

export default Alerts;
```
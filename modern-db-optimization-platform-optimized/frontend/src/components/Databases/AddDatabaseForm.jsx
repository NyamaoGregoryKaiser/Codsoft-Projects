import React, { useState } from 'react';
import * as dbConnectionsApi from '../../api/dbConnections';
import LoadingSpinner from '../Common/LoadingSpinner';

const AddDatabaseForm = ({ onConnectionAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgresql',
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: '',
    is_monitoring_active: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await dbConnectionsApi.createDbConnection(formData);
      onConnectionAdded(); // Notify parent to refresh list
      onCancel(); // Close form
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add database connection.');
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.message).join(', '));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Database Connection</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label htmlFor="name">Connection Name:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="type">Database Type:</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} disabled>
              <option value="postgresql">PostgreSQL</option>
              {/* Add other types as they are supported */}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="host">Host:</label>
            <input type="text" id="host" name="host" value={formData.host} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="port">Port:</label>
            <input type="number" id="port" name="port" value={formData.port} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="database">Database Name:</label>
            <input type="text" id="database" name="database" value={formData.database} onChange={handleChange} required />
          </div>
          <div className="form-group checkbox-group">
            <input type="checkbox" id="is_monitoring_active" name="is_monitoring_active" checked={formData.is_monitoring_active} onChange={handleChange} />
            <label htmlFor="is_monitoring_active">Enable Monitoring</label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Add Connection'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDatabaseForm;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as dbConnectionsApi from '../../api/dbConnections';
import MonitoredDbMetrics from './MonitoredDbMetrics';
import RecommendationList from '../Recommendations/RecommendationList';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/databaseDetails.css'; // Specific styles for db details

const DatabaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const fetchConnectionDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dbConnectionsApi.getDbConnectionById(id);
        setConnection(data);
        setEditFormData(data); // Initialize form data for editing
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch database connection details.');
      } finally {
        setLoading(false);
      }
    };
    fetchConnectionDetails();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Only send changed fields to avoid unnecessary updates/password issues
      const changes = Object.keys(editFormData).reduce((acc, key) => {
        if (editFormData[key] !== connection[key]) {
          acc[key] = editFormData[key];
        }
        return acc;
      }, {});

      if (Object.keys(changes).length === 0) {
        setIsEditing(false);
        setLoading(false);
        return;
      }

      const updated = await dbConnectionsApi.updateDbConnection(id, changes);
      setConnection(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update connection.');
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.message).join(', '));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMonitoring = async () => {
    setError('');
    setLoading(true); // Temporarily use page loading for toggle
    try {
      const updatedConnection = connection.is_monitoring_active
        ? await dbConnectionsApi.stopMonitoring(connection.id)
        : await dbConnectionsApi.startMonitoring(connection.id);
      setConnection(updatedConnection);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle monitoring.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!connection) {
    return <p>Connection not found.</p>;
  }

  return (
    <div className="database-details-page">
      <nav className="breadcrumb">
        <span onClick={() => navigate('/databases')}>Databases</span> &gt; <span>{connection.name}</span>
      </nav>

      <div className="details-header">
        <h2>{connection.name} ({connection.host}:{connection.port}/{connection.database})</h2>
        <div className="header-actions">
          <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary">
            {isEditing ? 'Cancel Edit' : 'Edit Connection'}
          </button>
          <button onClick={handleToggleMonitoring} className={connection.is_monitoring_active ? 'btn-warn' : 'btn-primary'}>
            {connection.is_monitoring_active ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateSubmit} className="edit-form form-grid">
          <h3>Edit Connection Details</h3>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="edit-name">Connection Name:</label>
            <input type="text" id="edit-name" name="name" value={editFormData.name || ''} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-host">Host:</label>
            <input type="text" id="edit-host" name="host" value={editFormData.host || ''} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-port">Port:</label>
            <input type="number" id="edit-port" name="port" value={editFormData.port || ''} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-username">Username:</label>
            <input type="text" id="edit-username" name="username" value={editFormData.username || ''} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-password">New Password (leave blank to keep current):</label>
            <input type="password" id="edit-password" name="password" value={editFormData.password || ''} onChange={handleEditChange} />
          </div>
          <div className="form-group">
            <label htmlFor="edit-database">Database Name:</label>
            <input type="text" id="edit-database" name="database" value={editFormData.database || ''} onChange={handleEditChange} required />
          </div>
          <div className="form-group checkbox-group">
            <input type="checkbox" id="edit-is_monitoring_active" name="is_monitoring_active" checked={editFormData.is_monitoring_active || false} onChange={handleEditChange} />
            <label htmlFor="edit-is_monitoring_active">Enable Monitoring</label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="connection-info card">
            <h3>Connection Information</h3>
            <p><strong>Connection ID:</strong> {connection.id}</p>
            <p><strong>Type:</strong> {connection.type}</p>
            <p><strong>Created At:</strong> {new Date(connection.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(connection.updated_at).toLocaleString()}</p>
        </div>
      )}

      <MonitoredDbMetrics dbConnectionId={id} isMonitoringActive={connection.is_monitoring_active} />
      <RecommendationList dbConnectionId={id} />
    </div>
  );
};

export default DatabaseDetails;
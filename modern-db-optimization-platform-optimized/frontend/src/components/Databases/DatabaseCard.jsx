import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as dbConnectionsApi from '../../api/dbConnections';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/databaseCard.css'; // Specific styles for db card

const DatabaseCard = ({ connection, onDeleteSuccess, onToggleMonitoring }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${connection.name}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      setError('');
      try {
        await dbConnectionsApi.deleteDbConnection(connection.id);
        onDeleteSuccess(connection.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete connection.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleMonitoring = async () => {
    setIsToggling(true);
    setError('');
    try {
      const updatedConnection = connection.is_monitoring_active
        ? await dbConnectionsApi.stopMonitoring(connection.id)
        : await dbConnectionsApi.startMonitoring(connection.id);
      onToggleMonitoring(updatedConnection);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle monitoring.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="database-card">
      <Link to={`/databases/${connection.id}`} className="card-content-link">
        <h3>{connection.name}</h3>
        <p><strong>Host:</strong> {connection.host}</p>
        <p><strong>Port:</strong> {connection.port}</p>
        <p><strong>Database:</strong> {connection.database}</p>
        <p><strong>User:</strong> {connection.username}</p>
        <p className="monitoring-status">
          <strong>Monitoring:</strong>{' '}
          <span className={connection.is_monitoring_active ? 'active' : 'inactive'}>
            {connection.is_monitoring_active ? 'Active' : 'Inactive'}
          </span>
        </p>
      </Link>
      {error && <p className="error-message">{error}</p>}
      <div className="card-actions">
        <button onClick={handleToggleMonitoring} disabled={isToggling}>
          {isToggling ? <LoadingSpinner size="small" /> : (connection.is_monitoring_active ? 'Stop Monitoring' : 'Start Monitoring')}
        </button>
        <button onClick={handleDelete} disabled={isDeleting} className="btn-danger">
          {isDeleting ? <LoadingSpinner size="small" /> : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default DatabaseCard;
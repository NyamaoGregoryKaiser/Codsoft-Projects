import React, { useState, useEffect } from 'react';
import * as dbConnectionsApi from '../../api/dbConnections';
import DatabaseCard from './DatabaseCard';
import AddDatabaseForm from './AddDatabaseForm';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/databaseList.css'; // Specific styles for db list

const DatabaseList = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchConnections = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dbConnectionsApi.getAllDbConnections();
      setConnections(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch database connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleDeleteSuccess = (deletedId) => {
    setConnections((prevConnections) => prevConnections.filter((conn) => conn.id !== deletedId));
  };

  const handleToggleMonitoring = (updatedConnection) => {
    setConnections((prevConnections) =>
      prevConnections.map((conn) =>
        conn.id === updatedConnection.id ? updatedConnection : conn
      )
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="database-list-container">
      <div className="list-header">
        <h2>Your Monitored Databases</h2>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">
          Add New Connection
        </button>
      </div>

      {showAddForm && (
        <AddDatabaseForm
          onConnectionAdded={fetchConnections}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {connections.length === 0 ? (
        <p>No database connections added yet. Click "Add New Connection" to get started.</p>
      ) : (
        <div className="database-cards-grid">
          {connections.map((connection) => (
            <DatabaseCard
              key={connection.id}
              connection={connection}
              onDeleteSuccess={handleDeleteSuccess}
              onToggleMonitoring={handleToggleMonitoring}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DatabaseList;
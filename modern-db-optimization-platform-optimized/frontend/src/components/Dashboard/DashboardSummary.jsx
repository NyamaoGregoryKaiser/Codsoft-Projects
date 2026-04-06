import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/dashboard.css'; // Shared dashboard styles

const DashboardSummary = ({ summaryData }) => {
  if (!summaryData) {
    return <p>No summary data available.</p>;
  }

  return (
    <div className="dashboard-summary">
      <div className="summary-card">
        <h3>Total Connections</h3>
        <p>{summaryData.totalConnections}</p>
      </div>
      <div className="summary-card">
        <h3>Active Monitoring</h3>
        <p>{summaryData.activeMonitoring}</p>
      </div>
      <div className="summary-card alert-card">
        <h3>Databases Needing Attention</h3>
        {/* Placeholder for actual alert logic */}
        <p>{summaryData.databases.filter(db => db.latestData && db.latestData.slowQueriesCount > 0).length} </p>
      </div>

      <div className="summary-section">
        <h3>Monitored Databases Overview</h3>
        <div className="database-overview-list">
          {summaryData.databases.length === 0 ? (
            <p>No databases configured yet. <Link to="/databases">Add one now!</Link></p>
          ) : (
            summaryData.databases.map((db) => (
              <Link to={`/databases/${db.id}`} key={db.id} className={`db-overview-card ${db.isMonitoringActive ? 'active' : 'inactive'}`}>
                <h4>{db.name} ({db.host})</h4>
                <p>Status: {db.isMonitoringActive ? 'Active' : 'Inactive'}</p>
                {db.latestData && (
                    <>
                        <p>DB Size: {db.latestData.databaseSize || 'N/A'}</p>
                        <p>Slow Queries: {db.latestData.slowQueries?.length || 0}</p>
                        <p>Last Monitored: {db.lastMonitored ? new Date(db.lastMonitored).toLocaleString() : 'Never'}</p>
                    </>
                )}
                {!db.latestData && db.isMonitoringActive && (
                    <p className="warning-text">Waiting for first metrics...</p>
                )}
                {!db.isMonitoringActive && (
                    <p className="info-text">Monitoring is inactive.</p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
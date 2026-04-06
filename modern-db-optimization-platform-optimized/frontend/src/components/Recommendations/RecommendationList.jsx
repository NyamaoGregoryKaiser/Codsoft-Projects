import React, { useState, useEffect } from 'react';
import * as recommendationsApi from '../../api/recommendations';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/recommendations.css';

const RecommendationList = ({ dbConnectionId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recommendationsApi.getRecommendations(dbConnectionId, filterStatus);
      setRecommendations(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [dbConnectionId, filterStatus]);

  const handleUpdateStatus = async (recommendationId, newStatus) => {
    setError('');
    try {
      const updatedRec = await recommendationsApi.updateRecommendationStatus(dbConnectionId, recommendationId, newStatus);
      setRecommendations((prevRecs) =>
        prevRecs.map((rec) => (rec.id === recommendationId ? { ...rec, status: updatedRec.status, resolved_at: updatedRec.resolved_at } : rec))
      );
      // If the filter status changes, re-fetch to ensure the item disappears from current view
      if (newStatus !== filterStatus && filterStatus !== 'all') {
        fetchRecommendations();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update recommendation status.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="recommendation-list-container">
      <h3>Database Recommendations</h3>
      <div className="recommendation-filters">
        <label htmlFor="status-filter">Filter by Status:</label>
        <select id="status-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="implemented">Implemented</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>
      {recommendations.length === 0 ? (
        <p>No {filterStatus === 'all' ? '' : filterStatus} recommendations found for this database.</p>
      ) : (
        <div className="recommendation-cards-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className={`recommendation-card severity-${rec.severity.toLowerCase()} status-${rec.status}`}>
              <div className="card-header">
                <span className={`severity-badge severity-${rec.severity.toLowerCase()}`}>{rec.severity}</span>
                <h4>{rec.title}</h4>
                <span className={`status-badge status-${rec.status}`}>{rec.status}</span>
              </div>
              <p className="rec-description">{rec.description}</p>
              {rec.sql_suggestion && (
                <div className="sql-suggestion">
                  <strong>SQL Suggestion:</strong>
                  <pre><code>{rec.sql_suggestion}</code></pre>
                </div>
              )}
              <div className="card-footer">
                <small>Generated: {new Date(rec.generated_at).toLocaleString()}</small>
                {rec.resolved_at && <small>Resolved: {new Date(rec.resolved_at).toLocaleString()}</small>}
                {rec.details && (
                  <details>
                    <summary>Details</summary>
                    <pre><code>{JSON.stringify(rec.details, null, 2)}</code></pre>
                  </details>
                )}
              </div>
              {rec.status === 'pending' && (
                <div className="card-actions">
                  <button onClick={() => handleUpdateStatus(rec.id, 'implemented')} className="btn-primary">
                    Mark as Implemented
                  </button>
                  <button onClick={() => handleUpdateStatus(rec.id, 'dismissed')} className="btn-secondary">
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationList;
```javascript
import React, { useEffect, useState } from 'react';
import { getInferenceLogs } from '../services/inferenceLogService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './InferenceLogsPage.css';

const InferenceLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    modelId: '',
    startDate: '',
    endDate: '',
    status: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getInferenceLogs(filters);
      setLogs(data.data);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch inference logs:', err);
      setError(err.message || 'Failed to load inference logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]); // Refetch when filters change

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  if (loading) {
    return <Loader message="Loading inference logs..." />;
  }

  return (
    <div className="inference-logs-page">
      <div className="list-header">
        <h1>Inference Logs</h1>
      </div>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}

      <div className="filters-container">
        <div className="form-group">
          <label htmlFor="modelId">Model ID:</label>
          <input
            type="text"
            id="modelId"
            name="modelId"
            value={filters.modelId}
            onChange={handleFilterChange}
            placeholder="Filter by Model ID"
          />
        </div>
        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="limit">Items per page:</label>
          <select
            id="limit"
            name="limit"
            value={filters.limit}
            onChange={handleFilterChange}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <p>No inference logs found with current filters.</p>
      ) : (
        <>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Model</th>
                <th>Status</th>
                <th>Duration (ms)</th>
                <th>Request Preview</th>
                <th>Response Preview</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.model ? `${log.model.name} (v${log.model.version})` : 'N/A'}</td>
                  <td className={`log-status-${log.status}`}>{log.status}</td>
                  <td>{log.duration_ms || 'N/A'}</td>
                  <td><pre className="payload-preview">{JSON.stringify(log.request_payload).substring(0, 100)}...</pre></td>
                  <td><pre className="payload-preview">{JSON.stringify(log.response_payload).substring(0, 100)}...</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span> Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit) || 1} </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InferenceLogsPage;
```
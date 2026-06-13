```typescript
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Dashboard } from '../types/Dashboard';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDescription, setNewDashboardDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboards');
      setDashboards(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboards.');
      console.error('Fetch dashboards error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) {
      setError('Dashboard name cannot be empty.');
      return;
    }
    try {
      await api.post('/dashboards', {
        name: newDashboardName,
        description: newDashboardDescription.trim() || null,
        visualizations: [] // Start with an empty array of visualizations
      });
      setNewDashboardName('');
      setNewDashboardDescription('');
      fetchDashboards(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create dashboard.');
      console.error('Create dashboard error:', err.response?.data);
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await api.delete(`/dashboards/${dashboardId}`);
        fetchDashboards(); // Refresh the list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete dashboard.');
        console.error('Delete dashboard error:', err.response?.data);
      }
    }
  };

  if (loading) {
    return <div className="dashboard-page">Loading dashboards...</div>;
  }

  return (
    <div className="dashboard-page">
      <h1>Your Dashboards</h1>
      {error && <p className="error-message">{error}</p>}

      <div className="create-dashboard-section">
        <h3>Create New Dashboard</h3>
        <form onSubmit={handleCreateDashboard} className="create-dashboard-form">
          <input
            type="text"
            placeholder="Dashboard Name"
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (Optional)"
            value={newDashboardDescription}
            onChange={(e) => setNewDashboardDescription(e.target.value)}
            rows={3}
          />
          <button type="submit">Create Dashboard</button>
        </form>
      </div>

      <div className="dashboards-list">
        {dashboards.length === 0 ? (
          <p>No dashboards created yet. Start by creating one above!</p>
        ) : (
          dashboards.map((dashboard) => (
            <div key={dashboard.id} className="dashboard-card">
              <Link to={`/dashboards/${dashboard.id}`} className="dashboard-card-link">
                <h2>{dashboard.name}</h2>
                {dashboard.description && <p>{dashboard.description}</p>}
                <small>Created: {new Date(dashboard.created_at).toLocaleDateString()}</small>
              </Link>
              <div className="dashboard-card-actions">
                <button
                  onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                  className="action-button view-button"
                >
                  View
                </button>
                {/* For full edit, a separate page could be made, this just views */}
                <button
                  onClick={() => handleDeleteDashboard(dashboard.id)}
                  className="action-button delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
```
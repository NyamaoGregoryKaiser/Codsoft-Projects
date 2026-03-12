```javascript
import React, { useEffect, useState, useCallback } from 'react';
import { getApplications } from '../api';
import AppCard from '../components/AppCard';
import AddApplicationForm from '../components/AddApplicationForm';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApplications();
      setApplications(response.data.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again.');
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApplicationAdded = (newApp) => {
    setApplications((prevApps) => [newApp, ...prevApps]);
  };

  const handleApplicationDeleted = (appId) => {
    setApplications((prevApps) => prevApps.filter((app) => app.id !== appId));
  };

  const handleApiKeyRegenerated = (appId, newApiKey) => {
    setApplications((prevApps) =>
      prevApps.map((app) =>
        app.id === appId ? { ...app, apiKey: newApiKey } : app
      )
    );
  };

  if (loading) {
    return <div className="dashboard-loading">Loading applications...</div>;
  }

  if (error) {
    return <div className="dashboard-error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>My Applications</h1>

      <AddApplicationForm onApplicationAdded={handleApplicationAdded} />

      {applications.length === 0 ? (
        <p className="no-applications">You haven't added any applications yet. Add one above to start monitoring!</p>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => (
            <AppCard
              key={app.id}
              application={app}
              onDeleteSuccess={handleApplicationDeleted}
              onApiKeyRegenerate={handleApiKeyRegenerated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```
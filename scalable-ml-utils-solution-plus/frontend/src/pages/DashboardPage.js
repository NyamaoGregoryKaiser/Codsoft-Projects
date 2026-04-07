```javascript
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading user data...</div>;
  }

  if (!user) {
    return <div className="container">Please log in to view the dashboard.</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <p>Your ML Utilities Hub Dashboard</p>
      </div>

      <section className="dashboard-overview">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/models/new" className="action-card">
            <h3>+ New Model</h3>
            <p>Register a new machine learning model.</p>
          </Link>
          <Link to="/datasets/new" className="action-card">
            <h3>+ New Dataset</h3>
            <p>Add a new dataset to your catalog.</p>
          </Link>
          <Link to="/models" className="action-card">
            <h3>View Models</h3>
            <p>Browse and manage all registered models.</p>
          </Link>
          <Link to="/datasets" className="action-card">
            <h3>View Datasets</h3>
            <p>Explore your managed datasets.</p>
          </Link>
          <Link to="/inference-logs" className="action-card">
            <h3>Inference Logs</h3>
            <p>Review past model inference requests.</p>
          </Link>
          <Link to="/profile" className="action-card">
            <h3>Edit Profile</h3>
            <p>Update your user information.</p>
          </Link>
        </div>
      </section>

      {/* You could add more sections here like:
          - Recently updated models/datasets
          - Recent inference activities
          - Quick stats (e.g., total models, datasets)
          - Admin specific links
      */}

      {user.role === 'admin' && (
        <section className="dashboard-admin-tools">
          <h2>Admin Tools</h2>
          <p>As an administrator, you have enhanced privileges.</p>
          <Link to="/admin-panel" className="btn btn-secondary">Go to Admin Panel (Future Feature)</Link>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
```
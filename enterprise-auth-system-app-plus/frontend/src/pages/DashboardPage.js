import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="dashboard-container">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="dashboard-container">Please login to view your dashboard.</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user.username}!</h2>
      <p>This is your personalized dashboard.</p>

      <div className="dashboard-actions">
        <h3>Quick Actions:</h3>
        <ul>
          <li><Link to="/profile" className="action-link">View Profile</Link></li>
          <li><Link to="/notes" className="action-link">Manage My Notes</Link></li>
          <li><Link to="/notes/create" className="action-link">Create New Note</Link></li>
          {user.roles.includes('ROLE_ADMIN') && (
            <li><Link to="/admin" className="action-link">Access Admin Panel</Link></li>
          )}
        </ul>
      </div>

      <div className="user-info-summary">
        <h3>Your Information:</h3>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
      </div>

      <p className="dashboard-footer">
        Explore the navigation bar to access more features.
      </p>
    </div>
  );
};

export default DashboardPage;
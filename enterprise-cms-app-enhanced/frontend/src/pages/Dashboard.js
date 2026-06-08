import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Welcome to your Dashboard, {user?.name}!</h2>
      <p>Your role: {user?.role}</p>
      {/* Add more dashboard content here, e.g., quick links, stats */}
      <div className="dashboard-widgets">
        <div className="widget">
          <h3>Recent Posts</h3>
          <p>View your latest content.</p>
          <button onClick={() => alert('Navigate to posts')}>Go to Posts</button>
        </div>
        <div className="widget">
          <h3>Media Library</h3>
          <p>Manage your uploaded files.</p>
          <button onClick={() => alert('Navigate to media')}>Go to Media</button>
        </div>
        {user?.role === 'admin' && (
          <div className="widget">
            <h3>User Management</h3>
            <p>Administer user accounts.</p>
            <button onClick={() => alert('Navigate to users')}>Go to Users</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
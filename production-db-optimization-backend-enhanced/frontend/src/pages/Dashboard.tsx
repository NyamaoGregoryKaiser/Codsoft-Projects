import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? (
        <>
          <p>Welcome, {user.firstName || user.email}!</p>
          <p>Your role: {user.role}</p>

          <div style={{ marginTop: '30px' }}>
            <h3>Quick Links:</h3>
            <ul>
              <li><Link to="/target-databases">Manage Target Databases</Link></li>
              <li><Link to="/analysis-reports">View Analysis Reports</Link></li>
              <li><Link to="/recommendations">Track Recommendations</Link></li>
              {user.role === 'ADMIN' && <li><Link to="/users">Manage Users</Link></li>}
            </ul>
          </div>

          <div className="detail-card" style={{marginTop: '30px'}}>
            <h3>System Status (Simulated)</h3>
            <div className="detail-item">
              <strong>Active Target Databases:</strong> 5
            </div>
            <div className="detail-item">
              <strong>Pending Recommendations:</strong> 12
            </div>
            <div className="detail-item">
              <strong>Last Report Generated:</strong> 2023-10-26 (Production DB)
            </div>
            <div className="detail-item">
              <strong>CPU Usage (Backend):</strong> 15%
            </div>
            <div className="detail-item">
              <strong>Memory Usage (Backend):</strong> 300MB
            </div>
            <p>This section would typically integrate with a real-time monitoring system.</p>
          </div>
        </>
      ) : (
        <p>Please log in to access the dashboard.</p>
      )}
    </div>
  );
};

export default Dashboard;
```
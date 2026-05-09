import React from 'react';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="page-title">Welcome to Your Dashboard!</h2>
      <div className="card">
        <h3>Hello, {user?.full_name || user?.email}!</h3>
        <p>This is your personalized dashboard. You can view quick stats, recent activities, or access important features here.</p>
        <p>Your current roles: {user?.roles?.map(role => role.name).join(', ') || 'None'}.</p>
        {user && !user.is_verified && (
          <p className="error-message">Your email is not verified. Please check your inbox for a verification link.</p>
        )}
      </div>
      <div className="card">
        <h3>Quick Links</h3>
        <ul>
          <li><a href="/profile">Edit Profile</a></li>
          {/* Add more links based on user roles or features */}
        </ul>
      </div>
    </div>
  );
}

export default DashboardPage;
```
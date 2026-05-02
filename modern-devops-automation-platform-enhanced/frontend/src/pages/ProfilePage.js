```javascript
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="container">Loading profile...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container">
      <h1>User Profile</h1>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
    </div>
  );
}

export default ProfilePage;
```
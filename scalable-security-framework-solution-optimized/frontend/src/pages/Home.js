```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container">
      <div className="card">
        <h2>Welcome to SecureSphere!</h2>
        <p>Your secure full-stack application demonstrating enterprise-grade security implementations.</p>
        
        {isAuthenticated ? (
          <>
            <p>You are logged in as <strong>{user?.email}</strong> with role <strong>{user?.role}</strong>.</p>
            <p><Link to="/dashboard" className="btn">Go to Dashboard</Link></p>
          </>
        ) : (
          <>
            <p>Please <Link to="/login">Login</Link> or <Link to="/register">Register</Link> to get started.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
```
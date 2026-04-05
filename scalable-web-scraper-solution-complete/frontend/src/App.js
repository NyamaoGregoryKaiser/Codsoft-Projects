import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const { token, user, loading, logout } = useAuth();
  const [globalError, setGlobalError] = useState(null); // For errors not specific to auth/tasks
  const [globalLoading, setGlobalLoading] = useState(false); // For global loading state

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        Loading application...
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="header">
          <h1>Web Scraper System</h1>
          {token && (
            <div>
              <span>Welcome, {user ? user.email : 'User'}!</span>
              <button onClick={logout} className="btn btn-danger" style={{ marginLeft: '15px' }}>
                Logout
              </button>
            </div>
          )}
        </header>

        <div className="container">
          {globalError && <p className="error-message">{globalError}</p>}
          {globalLoading && <p className="success-message">Loading...</p>} {/* Simple global loading indicator */}
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to="/dashboard" /> : <Auth onAuthSuccess={() => {}} />}
            />
            <Route
              path="/dashboard"
              element={token ? <Dashboard setGlobalError={setGlobalError} setGlobalLoading={setGlobalLoading} /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={<Navigate to={token ? "/dashboard" : "/login"} />}
            />
            {/* Add other routes like /admin for admin panel etc. */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
```
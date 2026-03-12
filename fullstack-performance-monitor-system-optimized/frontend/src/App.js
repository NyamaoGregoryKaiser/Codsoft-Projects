```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AppDetail from './pages/AppDetail';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './hooks/useAuth';

import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading application...</div>;
  }

  return (
    <div className="App">
      <Header />
      <main className="app-content">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/app/:appId" element={<PrivateRoute element={<AppDetail />} />} />

          {/* Default Route */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

          {/* Catch-all for unknown routes */}
          <Route path="*" element={<h1 className="not-found">404 - Page Not Found</h1>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
```
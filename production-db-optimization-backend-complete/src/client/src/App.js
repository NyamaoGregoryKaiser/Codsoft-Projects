import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ConnectionsPage from './pages/ConnectionsPage';
import QueryOptimizerPage from './pages/QueryOptimizerPage';
import MetricsMonitorPage from './pages/MetricsMonitorPage';
import SchemaViewerPage from './pages/SchemaViewerPage';
import UsersPage from './pages/UsersPage'; // Admin only
import AppLayout from './components/Layout/AppLayout';

function PrivateRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />; // Redirect unauthorized users
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="optimizer" element={<QueryOptimizerPage />} />
          <Route path="metrics/:connectionId?" element={<MetricsMonitorPage />} />
          <Route path="schema/:connectionId?" element={<SchemaViewerPage />} />
          <Route path="users" element={<PrivateRoute requiredRole="admin"><UsersPage /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
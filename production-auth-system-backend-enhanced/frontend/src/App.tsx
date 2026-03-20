import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import UnauthorizedPage from './pages/Unauthorized';
import ResetPasswordPage from './pages/ResetPassword'; // New page for reset password
import { UserRole } from './types/auth'; // Import UserRole

import './App.css'; // Global styles

const AuthStatus: React.FC = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();

  if (loading) {
    return <span>Loading...</span>;
  }

  return isAuthenticated ? (
    <span className="auth-status">
      Welcome, {user?.email} ({user?.role})!{' '}
      <button onClick={logout} className="logout-button">Logout</button>
    </span>
  ) : (
    <span className="auth-status">
      <Link to="/login" className="login-link">Login</Link> |{' '}
      <Link to="/register" className="register-link">Register</Link>
    </span>
  );
};


const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <nav className="navbar">
            <Link to="/" className="navbar-brand">Auth System</Link>
            <div className="navbar-links">
              <Link to="/dashboard">Dashboard</Link>
              <AuthStatus />
            </div>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} /> {/* Route for reset password */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <div><h2>Admin Panel</h2><p>This is a protected admin page.</p></div>
                </ProtectedRoute>
              } />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<div><h1>404 Not Found</h1><p>The page you are looking for does not exist.</p></div>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
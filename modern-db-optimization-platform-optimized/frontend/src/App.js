import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Common/Header';
import PrivateRoute from './components/Common/PrivateRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DatabasesPage from './pages/DatabasesPage';
import DatabaseDetailsPage from './pages/DatabaseDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './hooks/useAuth';
import './styles/index.css';

function App() {
  const { user, loading, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthStatus();
      setInitialCheckComplete(true);
    };
    initializeAuth();
  }, [checkAuthStatus]);

  // Redirect after initial auth check if not authenticated
  useEffect(() => {
    if (initialCheckComplete && !loading && !user) {
      navigate('/login');
    }
    if (initialCheckComplete && !loading && user && window.location.pathname === '/') {
        navigate('/dashboard'); // Redirect to dashboard if already logged in and on root
    }
  }, [initialCheckComplete, loading, user, navigate]);


  if (loading || !initialCheckComplete) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app-container">
      {user && <Header />}
      <main className="app-main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardPage />} /> {/* Redirects from here based on user state */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/databases" element={<DatabasesPage />} />
            <Route path="/databases/:id" element={<DatabaseDetailsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
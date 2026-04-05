import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TargetsPage from './pages/TargetsPage';
import ScrapeJobsPage from './pages/ScrapeJobsPage';
import ScrapedDataPage from './pages/ScrapedDataPage';
import TargetFormPage from './pages/TargetFormPage';
import NavBar from './components/NavBar'; // Basic navigation component
import ScrapedDataDetailsPage from './pages/ScrapedDataDetailsPage';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />; // Or an unauthorized page
  }

  return children;
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <NavBar />}
      <div className="container mx-auto p-4"> {/* Basic container styling */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/targets"
            element={
              <PrivateRoute>
                <TargetsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/targets/new"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}>
                <TargetFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/targets/edit/:targetId"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}>
                <TargetFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/scrape-jobs"
            element={
              <PrivateRoute>
                <ScrapeJobsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/scraped-data"
            element={
              <PrivateRoute>
                <ScrapedDataPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/scraped-data/:dataId"
            element={
              <PrivateRoute>
                <ScrapedDataDetailsPage />
              </PrivateRoute>
            }
          />
          {/* Add more private routes here */}
        </Routes>
      </div>
    </>
  );
}

export default App;
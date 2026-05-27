import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModelManagementPage from './pages/ModelManagementPage';
import InferencePage from './pages/InferencePage';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      <Header />
      <main className="app-main-content">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models"
            element={
              <ProtectedRoute>
                <ModelManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models/:modelId/inference"
            element={
              <ProtectedRoute>
                <InferencePage />
              </ProtectedRoute>
            }
          />
          {/* Add more protected routes as needed */}
          <Route path="*" element={<p>Page Not Found</p>} /> {/* Basic 404 */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
```
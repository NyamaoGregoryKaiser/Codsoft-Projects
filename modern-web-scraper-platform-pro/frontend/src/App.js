```javascript
// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WebsitesPage from './pages/WebsitesPage';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import ScrapedDataPage from './pages/ScrapedDataPage';
import PrivateRoute from './components/Common/PrivateRoute';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import authService from './services/auth.service';
import './App.css'; // Application-specific styles

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getToken();
      if (token && authService.isTokenValid(token)) {
        setIsAuthenticated(true);
        setUserRole(authService.getRole());
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        // Optionally redirect to login if not authenticated and trying to access a private route
        // This is handled by PrivateRoute component now
      }
    };
    checkAuth();

    // Listen for auth changes (e.g., from login/logout)
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <div className="app-container">
      {isAuthenticated && <Navbar onLogout={handleLogout} userRole={userRole} />}
      <div className="content-area">
        {isAuthenticated && <Sidebar userRole={userRole} />}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={<PrivateRoute isAuthenticated={isAuthenticated}><DashboardPage /></PrivateRoute>} />
            <Route path="/websites" element={<PrivateRoute isAuthenticated={isAuthenticated}><WebsitesPage /></PrivateRoute>} />
            <Route path="/jobs" element={<PrivateRoute isAuthenticated={isAuthenticated}><JobsPage /></PrivateRoute>} />
            <Route path="/jobs/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><JobDetailsPage /></PrivateRoute>} />
            <Route path="/data" element={<PrivateRoute isAuthenticated={isAuthenticated}><ScrapedDataPage /></PrivateRoute>} />

            {/* Admin-only routes would go here with an additional AdminRoute wrapper */}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
```
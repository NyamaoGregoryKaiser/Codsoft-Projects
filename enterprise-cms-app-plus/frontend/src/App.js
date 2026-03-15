```javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContentListPage from './pages/ContentListPage';
// Import pages for single item viewing/editing, e.g., PostDetailPage, CategoryDetailPage
// For this comprehensive example, we'll keep it simple to list pages.

import './App.css'; // Basic styling
import { getProfile, refreshToken, verifyToken } from './api/auth';
import api from './api/axiosInstance'; // To set global headers

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!accessToken && !storedRefreshToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsAuthChecking(false);
        return;
      }

      try {
        // Try to verify access token first
        if (accessToken) {
          await verifyToken(accessToken);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`; // Set for subsequent requests
          const profile = await getProfile();
          setUser(profile.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('Access token invalid or expired. Attempting refresh.', error);
        // Access token failed, try to refresh
        if (storedRefreshToken) {
          try {
            const refreshResponse = await refreshToken(storedRefreshToken);
            localStorage.setItem('accessToken', refreshResponse.data.access);
            localStorage.setItem('refreshToken', refreshResponse.data.refresh); // Update refresh token if it rotates
            api.defaults.headers.common.Authorization = `Bearer ${refreshResponse.data.access}`;
            const profile = await getProfile();
            setUser(profile.data);
            setIsAuthenticated(true);
          } catch (refreshError) {
            console.error('Refresh token failed:', refreshError);
            handleLogout(); // Clear tokens if refresh fails
          }
        } else {
          handleLogout(); // No refresh token, force logout
        }
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    delete api.defaults.headers.common.Authorization; // Clear authorization header
  };

  if (isAuthChecking) {
    return <div className="loading-screen">Authenticating...</div>; // Or a spinner
  }

  // Define PrivateRoute component
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Private Routes */}
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/posts" element={<PrivateRoute><ContentListPage contentType="posts" /></PrivateRoute>} />
          <Route path="/pages" element={<PrivateRoute><ContentListPage contentType="pages" /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><ContentListPage contentType="categories" /></PrivateRoute>} />
          <Route path="/tags" element={<PrivateRoute><ContentListPage contentType="tags" /></PrivateRoute>} />
          {/* Add routes for single item detail/edit pages, e.g.: */}
          {/* <Route path="/posts/:slug" element={<PrivateRoute><PostDetailPage /></PrivateRoute>} /> */}
          {/* <Route path="/posts/new" element={<PrivateRoute><PostCreatePage /></PrivateRoute>} /> */}

          {/* Redirect any unmatched routes to dashboard if authenticated, or login */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```
```javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthGuard from './components/AuthGuard';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import * as authService from './api/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken) {
        try {
          const decodedToken = jwtDecode(accessToken);
          if (decodedToken.exp * 1000 > Date.now()) { // Token not expired
            setIsAuthenticated(true);
            setUser({ id: decodedToken.user_id, email: decodedToken.email, role: decodedToken.role });
            return;
          }
        } catch (error) {
          console.error("Error decoding access token:", error);
        }
      }

      // If access token is expired or invalid, try to refresh
      if (refreshToken) {
        try {
          const newTokens = await authService.refreshToken(refreshToken);
          localStorage.setItem('access_token', newTokens.access_token);
          // Refresh token might not be returned, if it is, update it
          if (newTokens.refresh_token) {
            localStorage.setItem('refresh_token', newTokens.refresh_token);
          }
          const decodedToken = jwtDecode(newTokens.access_token);
          setIsAuthenticated(true);
          setUser({ id: decodedToken.user_id, email: decodedToken.email, role: decodedToken.role });
          return;
        } catch (error) {
          console.error("Error refreshing token:", error);
          handleLogout(); // If refresh fails, log out
        }
      }
      setIsAuthenticated(false);
      setUser(null);
    };

    checkAuth();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const tokens = await authService.login(email, password);
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      const decodedToken = jwtDecode(tokens.access_token);
      setIsAuthenticated(true);
      setUser({ id: decodedToken.user_id, email: decodedToken.email, role: decodedToken.role });
      return true;
    } catch (error) {
      console.error("Login failed:", error.response?.data?.detail || error.message);
      throw error;
    }
  };

  const handleRegister = async (email, password, fullName) => {
    try {
      await authService.register(email, password, fullName);
      return true;
    } catch (error) {
      console.error("Registration failed:", error.response?.data?.detail || error.message);
      throw error;
    }
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch (error) {
        console.error("Logout failed:", error.response?.data?.detail || error.message);
        // Even if API logout fails, clear local tokens
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <Header isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleRegister} />} />
          
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard isAuthenticated={isAuthenticated}>
                <Dashboard user={user} />
              </AuthGuard>
            } 
          />
          <Route 
            path="/projects/:id" 
            element={
              <AuthGuard isAuthenticated={isAuthenticated}>
                <ProjectDetail user={user} />
              </AuthGuard>
            } 
          />
          {/* Add more routes here, protected by AuthGuard if necessary */}
          <Route path="*" element={<h1>404: Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```
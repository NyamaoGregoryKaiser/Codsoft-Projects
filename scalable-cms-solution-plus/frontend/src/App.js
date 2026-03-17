import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute';
import * as authApi from './api/auth';
import './App.css';

// Create an AuthContext to manage authentication state globally
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (accessToken && refreshToken && userRole && userId) {
      // Basic check, ideally verify token validity with backend
      setIsAuthenticated(true);
      setUser({ id: userId, role: userRole });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userRole', response.role);
      localStorage.setItem('userId', response.userId);
      setIsAuthenticated(true);
      setUser({ id: response.userId, role: response.role });
      navigate('/dashboard'); // Redirect to dashboard on successful login
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken) {
        await authApi.logout(accessToken, refreshToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      setUser(null);
      navigate('/login'); // Redirect to login page after logout
    }
  };

  const authContextValue = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginForm onLoginSuccess={() => navigate('/dashboard')} />} />
            {/* Protected route example */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            {/* Add more routes here for managing posts, categories etc. */}
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

// Router must wrap App for useNavigate to work.
// This is a common pattern when using React Router v6.
function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter;
```
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import ApplicationDetails from './pages/ApplicationDetails/ApplicationDetails';
import PageDetails from './pages/PageDetails/PageDetails';
import NotFound from './pages/NotFound';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Loading authentication...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Loading authentication...</div>;
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)] bg-gray-50"> {/* Adjust height based on Navbar height */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute />}>
            <Route index element={<Login />} /> {/* Default landing page for unauthenticated */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/applications/:appId" element={<ApplicationDetails />} />
            <Route path="/applications/:appId/pages/:pageId" element={<PageDetails />} />
            {/* Add more private routes here */}
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
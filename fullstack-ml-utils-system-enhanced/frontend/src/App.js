```javascript
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Datasets from './pages/Datasets';
import DatasetDetail from './pages/DatasetDetail';
import Preprocessing from './pages/Preprocessing';
import Models from './pages/Models';
import ModelDetail from './pages/ModelDetail';

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className="container mx-auto p-4 flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasets"
            element={
              <ProtectedRoute>
                <Datasets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/datasets/:id"
            element={
              <ProtectedRoute>
                <DatasetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preprocessing"
            element={
              <ProtectedRoute>
                <Preprocessing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models"
            element={
              <ProtectedRoute>
                <Models />
              </ProtectedRoute>
            }
          />
          <Route
            path="/models/:id"
            element={
              <ProtectedRoute>
                <ModelDetail />
              </ProtectedRoute>
            }
          />
          {/* Add more protected routes as needed */}
          <Route path="*" element={<h1 className="text-center text-4xl text-gray-700 mt-20">404 - Not Found</h1>} />
        </Routes>
      </main>
      {/* Footer can be added here */}
    </>
  );
}

export default App;
```
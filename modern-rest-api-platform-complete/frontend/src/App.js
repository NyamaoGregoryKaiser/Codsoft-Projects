import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading authentication...</div>; // Or a proper spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/projects/:projectId" element={<PrivateRoute><ProjectDetailsPage /></PrivateRoute>} />
            <Route path="/projects/:projectId/tasks/:taskId" element={<PrivateRoute><TaskDetailsPage /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
```
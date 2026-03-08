```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import NavBar from './components/common/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import AlertForm from './pages/AlertForm';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/projects" element={<PrivateRoute element={<Projects />} />} />
            <Route path="/projects/new" element={<PrivateRoute element={<ProjectForm />} />} />
            <Route path="/projects/:projectId/edit" element={<PrivateRoute element={<ProjectForm />} />} />
            <Route path="/projects/:projectId/dashboard" element={<PrivateRoute element={<Dashboard />} />} />

            <Route path="/alerts" element={<PrivateRoute element={<Alerts />} />} />
            <Route path="/projects/:projectId/alerts/new" element={<PrivateRoute element={<AlertForm />} />} />
            <Route path="/projects/:projectId/alerts/:alertId/edit" element={<PrivateRoute element={<AlertForm />} />} />

            {/* Redirect any other unknown routes to home or login if not authenticated */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
```
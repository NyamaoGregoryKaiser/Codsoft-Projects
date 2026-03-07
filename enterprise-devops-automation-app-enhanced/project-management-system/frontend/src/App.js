```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import AuthPage from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import ProjectListPage from './pages/ProjectList';
import ProjectDetailPage from './pages/ProjectDetail';
import TaskDetailPage from './pages/TaskDetail';
import { useAuth } from './contexts/AuthContext';
import './App.css'; // Global App styles

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="App-content">
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><ProjectListPage /></PrivateRoute>} />
            <Route path="/projects/:projectId" element={<PrivateRoute><ProjectDetailPage /></PrivateRoute>} />
            <Route path="/projects/:projectId/tasks/:taskId" element={<PrivateRoute><TaskDetailPage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
            <Route path="*" element={<h1>404 Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
```
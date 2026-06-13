```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VisualizationEditorPage from './pages/VisualizationEditorPage';
import DataSourcesPage from './pages/DataSourcesPage';
import ViewDashboardPage from './pages/ViewDashboardPage';
import Layout from './components/Layout';
import './styles/App.css'; // For general app styling

// A wrapper for protected routes
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="data-sources" element={<PrivateRoute><DataSourcesPage /></PrivateRoute>} />
        <Route path="visualizations/new" element={<PrivateRoute><VisualizationEditorPage /></PrivateRoute>} />
        <Route path="visualizations/edit/:id" element={<PrivateRoute><VisualizationEditorPage /></PrivateRoute>} />
        <Route path="dashboards" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="dashboards/:id" element={<PrivateRoute><ViewDashboardPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<p>Page Not Found</p>} />
    </Routes>
  );
};

export default App;
```
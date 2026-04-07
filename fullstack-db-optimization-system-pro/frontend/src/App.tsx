import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import Metrics from './pages/Metrics';
import OptimizationSuggestions from './pages/OptimizationSuggestions';
import Tasks from './pages/Tasks';
import Users from './pages/Users'; // Admin-only route

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="databases" element={<Databases />} />
        <Route path="databases/:dbId/metrics" element={<Metrics />} />
        <Route path="databases/:dbId/suggestions" element={<OptimizationSuggestions />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="users" element={<Users />} /> {/* This route will have further admin role check within the Users page */}
      </Route>
      {/* Fallback route for unmatched paths */}
      <Route path="*" element={<p className="flex items-center justify-center h-full text-2xl font-bold">404 - Page Not Found</p>} />
    </Routes>
  );
}

export default App;
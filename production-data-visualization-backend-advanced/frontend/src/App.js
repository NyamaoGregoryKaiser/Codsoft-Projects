import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardListPage from './pages/DashboardListPage';
import DashboardDetailPage from './pages/DashboardDetailPage';
import DashboardBuilderPage from './pages/DashboardBuilderPage';
import ChartListPage from './pages/ChartListPage';
import ChartBuilderPage from './pages/ChartBuilderPage';
import DataSourceListPage from './pages/DataSourceListPage';
import DataSourceFormPage from './pages/DataSourceFormPage';
import UserManagementPage from './pages/UserManagementPage';
import NotFoundPage from './pages/NotFoundPage';

// Private Route Component
const PrivateRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        Loading application...
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or show an access denied page
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Flex direction="column" minH="100vh">
      {isAuthenticated && <Header />}
      <Flex flex="1">
        {isAuthenticated && <Sidebar />}
        <Box
          flex="1"
          p={isAuthenticated ? 4 : 0} // Adjust padding if sidebar is present
          ml={isAuthenticated ? { base: 0, md: '200px' } : 0} // Adjust margin if sidebar is present
          transition="margin-left 0.3s ease-in-out"
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={<PrivateRoute><DashboardListPage /></PrivateRoute>} />
            <Route path="/dashboards" element={<PrivateRoute><DashboardListPage /></PrivateRoute>} />
            <Route path="/dashboards/:id" element={<PrivateRoute><DashboardDetailPage /></PrivateRoute>} />
            <Route path="/dashboards/new" element={<PrivateRoute><DashboardBuilderPage /></PrivateRoute>} />
            <Route path="/dashboards/:id/edit" element={<PrivateRoute><DashboardBuilderPage /></PrivateRoute>} />

            <Route path="/charts" element={<PrivateRoute><ChartListPage /></PrivateRoute>} />
            <Route path="/charts/new" element={<PrivateRoute><ChartBuilderPage /></PrivateRoute>} />
            <Route path="/charts/:id/edit" element={<PrivateRoute><ChartBuilderPage /></PrivateRoute>} />

            <Route path="/data-sources" element={<PrivateRoute><DataSourceListPage /></PrivateRoute>} />
            <Route path="/data-sources/new" element={<PrivateRoute><DataSourceFormPage /></PrivateRoute>} />
            <Route path="/data-sources/:id/edit" element={<PrivateRoute><DataSourceFormPage /></PrivateRoute>} />

            <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><UserManagementPage /></PrivateRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>
      </Flex>
    </Flex>
  );
}

export default App;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import UsersPage from './pages/UsersPage';
import MerchantsPage from './pages/MerchantsPage'; // Admin only
import WebhooksPage from './pages/WebhooksPage';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute';
import { UserRole } from './types/auth'; // Re-use types from backend

function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      {isAuthenticated && <Navbar />}
      <Box p={isAuthenticated ? 4 : 0}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          <Route
            path="/dashboard"
            element={<PrivateRoute roles={[UserRole.MERCHANT_USER, UserRole.ADMIN]} element={<DashboardPage />} />}
          />
          <Route
            path="/transactions"
            element={<PrivateRoute roles={[UserRole.MERCHANT_USER, UserRole.ADMIN]} element={<TransactionsPage />} />}
          />
          <Route
            path="/transactions/create"
            element={<PrivateRoute roles={[UserRole.MERCHANT_USER]} element={<CreateTransactionPage />} />}
          />
          <Route
            path="/transactions/:id"
            element={<PrivateRoute roles={[UserRole.MERCHANT_USER, UserRole.ADMIN]} element={<TransactionDetailsPage />} />}
          />
          <Route
            path="/users"
            element={<PrivateRoute roles={[UserRole.MERCHANT_USER, UserRole.ADMIN]} element={<UsersPage />} />}
          />
          <Route
            path="/merchants"
            element={<PrivateRoute roles={[UserRole.ADMIN]} element={<MerchantsPage />} />}
          />
          <Route
            path="/webhooks"
            element={<PrivateRoute roles={[UserRole.MERCHANT_USER]} element={<WebhooksPage />} />}
          />

          <Route path="*" element={<Box textAlign="center" py={10}>404 Not Found</Box>} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
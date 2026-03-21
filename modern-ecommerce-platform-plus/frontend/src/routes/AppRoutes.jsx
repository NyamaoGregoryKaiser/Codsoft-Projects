import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import ProductList from '../components/product/ProductList'; // Display list of products

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="text-center py-8">Loading application...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
      />

      {/* Example Protected Route for User Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <h1 className="text-2xl font-bold">User Profile</h1>
            <p>Welcome, {user?.name || 'User'}!</p>
            <p>Email: {user?.email}</p>
            <p>Role: {user?.role}</p>
          </ProtectedRoute>
        }
      />

      {/* Example Admin Protected Route */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute adminOnly={true}>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p>Welcome to the Admin Area, {user?.name || 'Admin'}!</p>
            <p>This content is only visible to users with 'admin' role.</p>
            {/* Add admin specific components here, e.g., Product Management */}
          </ProtectedRoute>
        }
      />

      {/* Catch-all for 404 Not Found */}
      <Route path="*" element={<h1 className="text-center text-3xl font-bold py-16">404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default AppRoutes;
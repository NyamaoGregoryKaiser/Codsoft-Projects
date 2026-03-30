```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PaymentFormPage from './pages/PaymentFormPage'; // Public payment page for customers
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Header /> {/* Global header, conditionally renders based on auth state */}
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pay/:transactionId" element={<PaymentFormPage />} /> {/* Public payment form */}

          {/* Protected Routes for Merchants/Admins */}
          <Route element={<ProtectedRoute allowedRoles={['MERCHANT', 'ADMIN']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Add more protected routes for transaction lists, webhook management, etc. */}
          </Route>

          <Route path="/" element={<DashboardPage />} /> {/* Redirect to dashboard if logged in */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```
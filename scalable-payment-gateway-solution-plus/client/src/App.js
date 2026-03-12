```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MerchantDashboardPage from './pages/MerchantDashboardPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import PrivateRoute from './components/Auth/PrivateRoute';
import { useAuth } from './context/AuthContext';
import ProductsPage from './pages/ProductsPage';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            {/* Private Routes */}
            <Route
              path="/merchant/dashboard"
              element={
                <PrivateRoute allowedRoles={['merchant']}>
                  <MerchantDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout/:productId"
              element={
                <PrivateRoute allowedRoles={['customer']}>
                  <CheckoutPage />
                </PrivateRoute>
              }
            />
            {/* Add more routes for admin, customer profiles, etc. */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
```

#### Frontend Core Components (Examples)
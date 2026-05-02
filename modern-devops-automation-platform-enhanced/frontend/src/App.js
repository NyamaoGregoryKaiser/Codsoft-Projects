```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';

// A simple PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <ProductListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <PrivateRoute>
              <ProductFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/edit/:id"
          element={
            <PrivateRoute>
              <ProductFormPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
```
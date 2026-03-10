import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from 'contexts/AuthContext';
import ProtectedRoute from 'components/ProtectedRoute';

import Login from 'pages/Auth/Login';
import Register from 'pages/Auth/Register';
import Dashboard from 'pages/Dashboard';
import ProductList from 'pages/Products/ProductList';
import ProductForm from 'pages/Products/ProductForm';
import UserList from 'pages/Users/UserList';
import Unauthorized from 'pages/Unauthorized';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div style={styles.appContainer}>
          <nav style={styles.navbar}>
            <Link to="/" style={styles.navLink}>Home</Link>
            <Link to="/products" style={styles.navLink}>Products</Link>
            {/* Add more nav links if needed */}
          </nav>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm isEditing />} />
              <Route path="/users" element={<UserList />} />
            </Route>

            {/* Catch-all for 404 */}
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '15px 30px',
    backgroundColor: '#343a40',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navLink: {
    color: '#ffffff',
    textDecoration: 'none',
    marginRight: '20px',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'color 0.2s ease-in-out',
  },
};

export default App;
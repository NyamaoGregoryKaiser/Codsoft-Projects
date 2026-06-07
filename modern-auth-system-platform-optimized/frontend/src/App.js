```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css'; // Simple global styling

function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute allowedRoles={['USER', 'ADMIN']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Default route to dashboard if logged in, otherwise login */}
          <Route
            path="/"
            element={user ? <DashboardPage /> : <LoginPage />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
```
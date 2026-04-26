```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound'; // Add a Not Found page

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add more user-specific routes here */}
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Add more admin-specific routes here */}
        </Route>

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
        {/* Add an Unauthorized page if you want a specific redirection target */}
        <Route path="/unauthorized" element={<div className="container card alert alert-error">You are not authorized to view this page.</div>} />
      </Routes>
    </Router>
  );
}

export default App;
```
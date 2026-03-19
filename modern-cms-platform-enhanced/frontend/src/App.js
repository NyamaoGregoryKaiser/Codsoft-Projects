```javascript
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PostDetailPage from './pages/PostDetailPage';
import PostFormPage from './pages/PostFormPage';
import UserManagementPage from './pages/UserManagementPage';
import CategoryTagManagementPage from './pages/CategoryTagManagementPage';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/posts/:slug" element={<PostDetailPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/dashboard/posts/new" element={<PrivateRoute roles={['admin', 'author']}><PostFormPage /></PrivateRoute>} />
          <Route path="/dashboard/posts/edit/:id" element={<PrivateRoute roles={['admin', 'author']}><PostFormPage /></PrivateRoute>} />

          {/* Admin Specific Routes */}
          <Route path="/dashboard/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
          <Route path="/dashboard/taxonomy" element={<AdminRoute><CategoryTagManagementPage /></AdminRoute>} />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
```
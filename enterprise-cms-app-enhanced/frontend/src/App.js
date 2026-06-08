import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import PostsPage from './pages/Posts';
import CategoriesPage from './pages/Categories'; // Placeholder
import MediaPage from './pages/Media'; // Placeholder
import UsersPage from './pages/Users'; // Placeholder
import UnauthorizedPage from './pages/Unauthorized'; // Placeholder
import NotFoundPage from './pages/NotFound'; // Placeholder

import './App.css'; // Global styles

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route element={<ProtectedRoute roles={['admin', 'editor']} />}>
                <Route path="/posts" element={<PostsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin', 'editor', 'user']} />}>
                <Route path="/media" element={<MediaPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;
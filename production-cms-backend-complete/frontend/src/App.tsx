import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ContentListPage from './pages/ContentListPage';
import ContentDetailPage from './pages/ContentDetailPage';
import ContentFormPage from './pages/ContentFormPage';
import CategoryListPage from './pages/CategoryListPage';
import CategoryFormPage from './pages/CategoryFormPage';
import UserListPage from './pages/UserListPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Public Content Routes (Viewers, Editors, Admins) */}
                <Route path="/content" element={<ContentListPage />} />
                <Route path="/content/:id" element={<ContentDetailPage />} />

                {/* Protected Routes - require authentication */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                {/* Protected Routes - require specific roles */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.EDITOR]} />}>
                  <Route path="/content/new" element={<ContentFormPage />} />
                  <Route path="/content/edit/:id" element={<ContentFormPage />} />
                  <Route path="/categories" element={<CategoryListPage />} />
                  <Route path="/categories/new" element={<CategoryFormPage />} />
                  <Route path="/categories/edit/:id" element={<CategoryFormPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                  <Route path="/users" element={<UserListPage />} />
                </Route>

                {/* Fallback for unknown routes */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </Provider>
  );
};

export default App;
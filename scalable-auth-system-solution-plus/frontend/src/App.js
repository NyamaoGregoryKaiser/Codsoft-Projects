import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import Profile from './components/user/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import TaskList from './components/task/TaskList';
import TaskForm from './components/task/TaskForm';
import { UserRole } from './utils/constants';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Public Routes - accessible to unauthenticated users */}
          <Route element={<PublicRoute />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes - accessible only to authenticated users */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/tasks/edit/:id" element={<TaskForm />} />
          </Route>

          {/* Admin Protected Routes - accessible only to ADMINs */}
          {/* Example: Admin-specific user management page */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            {/* <Route path="/admin/users" element={<AdminUserList />} /> */}
            {/* <Route path="/admin/tasks" element={<AdminAllTasksList />} /> */}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
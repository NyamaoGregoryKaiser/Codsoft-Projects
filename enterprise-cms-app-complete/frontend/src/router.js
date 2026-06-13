import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './utils/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PostListPage from './pages/PostListPage';
import PostCreateEditPage from './pages/PostCreateEditPage';
import CategoryListPage from './pages/CategoryListPage';
import MediaListPage from './pages/MediaListPage';
import UserProfilePage from './pages/UserProfilePage'; // Example page
import PublicPostViewPage from './pages/PublicPostViewPage'; // For viewing single posts publicly

// A generic private route component
const PrivateRoute = ({ children, roles = [] }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Logged in but unauthorized, redirect to dashboard or show error
    return <Navigate to="/dashboard" replace />; // Or a 403 Forbidden page
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PostListPage />} /> {/* Home page can be post list */}
      <Route path="/posts/:identifier" element={<PublicPostViewPage />} />


      {/* Private Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <UserProfilePage />
          </PrivateRoute>
        }
      />

      {/* Post Management */}
      <Route
        path="/admin/posts"
        element={
          <PrivateRoute roles={['admin', 'editor', 'author']}>
            <PostListPage managementView={true} />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/posts/new"
        element={
          <PrivateRoute roles={['admin', 'editor', 'author']}>
            <PostCreateEditPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/posts/edit/:id"
        element={
          <PrivateRoute roles={['admin', 'editor', 'author']}>
            <PostCreateEditPage />
          </PrivateRoute>
        }
      />

      {/* Category Management */}
      <Route
        path="/admin/categories"
        element={
          <PrivateRoute roles={['admin', 'editor']}>
            <CategoryListPage />
          </PrivateRoute>
        }
      />

      {/* Media Management */}
      <Route
        path="/admin/media"
        element={
          <PrivateRoute roles={['admin', 'editor', 'author']}>
            <MediaListPage />
          </PrivateRoute>
        }
      />

      {/* Redirect unknown paths to home or 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
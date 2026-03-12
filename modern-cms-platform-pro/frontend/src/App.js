import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage'; // Simple 404 page
import UnauthorizedPage from './pages/UnauthorizedPage'; // Simple 403 page

// Admin Layout and Pages
import AdminLayout from './components/Layout/AdminLayout';
import RequireAuth from './components/Auth/RequireAuth';
import DashboardPage from './pages/Admin/DashboardPage';
import PostManagementPage from './pages/Admin/PostManagementPage';
import PostFormPage from './pages/Admin/PostFormPage';
import PageManagementPage from './pages/Admin/PageManagementPage';
import PageFormPage from './pages/Admin/PageFormPage';
import CategoryManagementPage from './pages/Admin/CategoryManagementPage';
import TagManagementPage from './pages/Admin/TagManagementPage';
import MediaManagementPage from './pages/Admin/MediaManagementPage';
// import UserManagementPage from './pages/Admin/UserManagementPage'; // (Requires implementation)
// import SettingsPage from './pages/Admin/SettingsPage'; // (Requires implementation)

// Public facing pages (simplified for this example)
import HomePage from './pages/Public/HomePage';
import PostDetailPage from './pages/Public/PostDetailPage';
import PageDetailPage from './pages/Public/PageDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:slug" element={<PostDetailPage />} />
          <Route path="/pages/:slug" element={<PageDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin Routes - Protected by Auth and Roles */}
          <Route element={<RequireAuth allowedRoles={['staff', 'admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />

              <Route path="posts" element={<PostManagementPage />} />
              <Route path="posts/new" element={<PostFormPage />} />
              <Route path="posts/:slug/edit" element={<PostFormPage />} />

              <Route path="pages" element={<PageManagementPage />} />
              <Route path="pages/new" element={<PageFormPage />} />
              <Route path="pages/:slug/edit" element={<PageFormPage />} />

              <Route path="categories" element={<CategoryManagementPage />} />
              <Route path="tags" element={<TagManagementPage />} />
              <Route path="media" element={<MediaManagementPage />} />
              {/* <Route path="users" element={<RequireAuth allowedRoles={['admin']}><UserManagementPage /></RequireAuth>} /> */}
              {/* <Route path="settings" element={<RequireAuth allowedRoles={['admin']}><SettingsPage /></RequireAuth>} /> */}
            </Route>
          </Route>

          {/* Catch all - 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

#### `frontend/src/index.js`

```javascript
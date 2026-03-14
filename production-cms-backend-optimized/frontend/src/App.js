```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import ContentTypesPage from './pages/ContentTypesPage';
import ContentItemsPage from './pages/ContentItemsPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/layout/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css'; // TailwindCSS output

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredRoles={['Admin']}><UsersPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute requiredRoles={['Admin']}><RolesPage /></ProtectedRoute>} />
            <Route path="/content-types" element={<ProtectedRoute requiredPermissions={['manage_content_types']}><ContentTypesPage /></ProtectedRoute>} />
            <Route path="/content-items" element={<ProtectedRoute requiredPermissions={['read_content_items']}><ContentItemsPage /></ProtectedRoute>} />
            <Route path="/content-items/new" element={<ProtectedRoute requiredPermissions={['create_content_items']}><ContentItemsPage isNew={true} /></ProtectedRoute>} />
            <Route path="/content-items/edit/:id" element={<ProtectedRoute requiredPermissions={['update_content_items']}><ContentItemsPage isEdit={true} /></ProtectedRoute>} />
            <Route path="/media" element={<ProtectedRoute requiredPermissions={['manage_media']}><MediaLibraryPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRoles={['Admin']}><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Router>
  );
}

export default App;
```
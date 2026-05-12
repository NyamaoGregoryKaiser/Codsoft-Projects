```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ContentTypes from './pages/ContentTypes';
import ContentTypeForm from './pages/ContentTypeForm';
import EntriesList from './pages/EntriesList';
import EntryForm from './pages/EntryForm';
import MediaLibrary from './pages/MediaLibrary';
import Users from './pages/Users';
import NotFound from './pages/NotFound'; // Create a simple 404 page
import Unauthorized from './pages/Unauthorized'; // Create a simple 403 page
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute roles={['admin', 'editor', 'viewer']} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/entries" element={<EntriesList />} /> {/* Generic link, will navigate to a specific type */}
            </Route>

            <Route element={<ProtectedRoute roles={['admin', 'editor', 'viewer']} />}>
              <Route path="/media" element={<MediaLibrary />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/content-types" element={<ContentTypes />} />
              <Route path="/content-types/new" element={<ContentTypeForm />} />
              <Route path="/content-types/:contentTypeId" element={<ContentTypeForm />} />
              <Route path="/users" element={<Users />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin', 'editor', 'viewer']} />}>
              <Route path="/content-types/:contentTypeId/entries" element={<EntriesList />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin', 'editor']} />}>
              <Route path="/content-types/:contentTypeId/entries/new" element={<EntryForm />} />
              <Route path="/content-types/:contentTypeId/entries/:entryId" element={<EntryForm />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnHover />
      </AuthProvider>
    </Router>
  );
}

export default App;
```
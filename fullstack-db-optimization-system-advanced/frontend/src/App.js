import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SlowQueriesPage from './pages/SlowQueriesPage';
import IndexSuggestionsPage from './pages/IndexSuggestionsPage';
import SchemaAnalysisPage from './pages/SchemaAnalysisPage';
import MetricsPage from './pages/MetricsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="flex-grow"> {/* This makes content grow to fill space */}
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private Routes (User must be authenticated) */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<DashboardPage />} /> {/* Default private route */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/slow-queries" element={<SlowQueriesPage />} />
              <Route path="/index-suggestions" element={<IndexSuggestionsPage />} />
              <Route path="/schema-analysis" element={<SchemaAnalysisPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
            </Route>

            {/* Admin-specific routes can be nested like this: */}
            {/* <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route> */}

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<h1 className="text-center mt-10 text-xl">404 - Page Not Found</h1>} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </AuthProvider>
    </Router>
  );
}

export default App;
```

#### `frontend/src/index.js`
```javascript
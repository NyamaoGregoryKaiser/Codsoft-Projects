```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <Link to="/">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button onClick={logout} style={{ marginLeft: '10px' }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ marginLeft: '10px' }}>Login</Link>
                <Link to="/register" style={{ marginLeft: '10px' }}>Register</Link>
              </>
            )}
          </nav>
        </header>
        <main className="App-main">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <PrivateRoute>
                  <ProjectDetail />
                </PrivateRoute>
              }
            />
            {/* Catch all for unknown routes */}
            <Route path="*" element={<p>Page Not Found</p>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
```
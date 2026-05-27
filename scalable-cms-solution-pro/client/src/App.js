```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PostsPage from './pages/PostsPage';
import PostDetail from './pages/PostDetail';
import PrivateRoute from './routes/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/posts" element={<PrivateRoute><PostsPage /></PrivateRoute>} />
            <Route path="/posts/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
            {/* Add more private routes for categories, users, media management */}
            {/* Public routes or 404 handler */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
```
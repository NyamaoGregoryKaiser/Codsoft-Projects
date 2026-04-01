```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Datasets from './pages/Datasets';
import DatasetDetail from './pages/DatasetDetail';
import Models from './pages/Models';
import ModelDetail from './pages/ModelDetail';
import Experiments from './pages/Experiments';
import ExperimentDetail from './pages/ExperimentDetail';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header'; // Assuming you have a Header component

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            <Route path="/datasets" element={<ProtectedRoute><Datasets /></ProtectedRoute>} />
            <Route path="/datasets/:id" element={<ProtectedRoute><DatasetDetail /></ProtectedRoute>} />
            
            <Route path="/models" element={<ProtectedRoute><Models /></ProtectedRoute>} />
            <Route path="/models/:id" element={<ProtectedRoute><ModelDetail /></ProtectedRoute>} />

            <Route path="/experiments" element={<ProtectedRoute><Experiments /></ProtectedRoute>} />
            <Route path="/experiments/:id" element={<ProtectedRoute><ExperimentDetail /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
```
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/auth/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ModelsPage from './pages/ModelsPage';
import ModelDetailPage from './pages/ModelDetailPage';
import DatasetsPage from './pages/DatasetsPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import ProfilePage from './pages/ProfilePage';
import InferenceLogsPage from './pages/InferenceLogsPage';
import CreateModelPage from './pages/CreateModelPage';
import CreateDatasetPage from './pages/CreateDatasetPage';
import UpdateModelPage from './pages/UpdateModelPage';
import UpdateDatasetPage from './pages/UpdateDatasetPage';
import NotFoundPage from './pages/NotFoundPage';
import Home from './pages/Home';
import './App.css'; // Basic styling

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            <Route path="/models" element={<PrivateRoute><ModelsPage /></PrivateRoute>} />
            <Route path="/models/new" element={<PrivateRoute><CreateModelPage /></PrivateRoute>} />
            <Route path="/models/:id" element={<PrivateRoute><ModelDetailPage /></PrivateRoute>} />
            <Route path="/models/:id/edit" element={<PrivateRoute><UpdateModelPage /></PrivateRoute>} />


            <Route path="/datasets" element={<PrivateRoute><DatasetsPage /></PrivateRoute>} />
            <Route path="/datasets/new" element={<PrivateRoute><CreateDatasetPage /></PrivateRoute>} />
            <Route path="/datasets/:id" element={<PrivateRoute><DatasetDetailPage /></PrivateRoute>} />
            <Route path="/datasets/:id/edit" element={<PrivateRoute><UpdateDatasetPage /></PrivateRoute>} />

            <Route path="/inference-logs" element={<PrivateRoute><InferenceLogsPage /></PrivateRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
```
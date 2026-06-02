import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/common/PrivateRoute';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import { Layout } from 'antd';

const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '0 50px', marginTop: 64 }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 380 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
              <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
              {/* Add routes for admin-only pages here if needed */}

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Content>
        <AppFooter />
      </Layout>
    </Router>
  );
}

export default App;
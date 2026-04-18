import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthProvider } from './contexts/AuthContext';
import { ContentManagementPage } from './pages/dashboard/ContentManagementPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <main className="py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/content/:idOrSlug" element={<ContentDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/content" element={<ContentManagementPage />} />
            {/* Add more dashboard routes as needed for Categories, Tags, Users, Roles */}
            <Route path="*" element={<h1 className="text-center text-3xl font-bold mt-10">404: Page Not Found</h1>} />
          </Routes>
        </main>
      </AuthProvider>
    </Router>
  );
}

export default App;
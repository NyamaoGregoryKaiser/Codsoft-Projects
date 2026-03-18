import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ModelsPage from './pages/Models/ModelsPage';
import ModelDetailPage from './pages/Models/ModelDetailPage';
import ModelUploadPage from './pages/Models/ModelUploadPage';
import TransformsPage from './pages/Transforms/TransformsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Box, Spinner, Flex } from '@chakra-ui/react';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex height="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/models" element={<ProtectedRoute><Layout><ModelsPage /></Layout></ProtectedRoute>} />
      <Route path="/models/upload" element={<ProtectedRoute><Layout><ModelUploadPage /></Layout></ProtectedRoute>} />
      <Route path="/models/:id" element={<ProtectedRoute><Layout><ModelDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/transforms" element={<ProtectedRoute><Layout><TransformsPage /></Layout></ProtectedRoute>} />
      {/* Add more protected routes as needed */}
      <Route path="*" element={<Box p={4}>404 Not Found</Box>} /> {/* Simple 404 */}
    </Routes>
  );
}

export default App;
```
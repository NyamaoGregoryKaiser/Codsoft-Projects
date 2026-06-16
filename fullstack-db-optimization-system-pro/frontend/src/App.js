```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DatabaseListPage from './pages/DatabaseListPage';
import DatabaseDetailPage from './pages/DatabaseDetailPage';
import QueryAnalysisPage from './pages/QueryAnalysisPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Box>Loading...</Box>; // Or a spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const { isAuthenticated } = useAuth(); // For showing/hiding sidebar/navbar

  return (
    <Router>
      <Box display="flex" minH="100vh">
        {isAuthenticated && <Sidebar />}
        <Box flex="1" ml={isAuthenticated ? "250px" : "0"}> {/* Adjust margin for sidebar */}
          {isAuthenticated && <Navbar />}
          <Box p={4}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/databases" element={<PrivateRoute><DatabaseListPage /></PrivateRoute>} />
              <Route path="/databases/:id" element={<PrivateRoute><DatabaseDetailPage /></PrivateRoute>} />
              <Route path="/databases/:id/queries" element={<PrivateRoute><QueryAnalysisPage /></PrivateRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
```
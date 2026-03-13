```typescript
import React from 'react';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConnectionsPage from './pages/ConnectionsPage';
import MonitorPage from './pages/MonitorPage';

// 1. Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    900: '#1a365d',
    800: '#153e75',
    700: '#2a69ac',
  },
};
const theme = extendTheme({ colors });

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Navbar />
          <Box pt="64px"> {/* Offset for fixed navbar if it were fixed */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/connections/:connectionId/monitor" element={<MonitorPage />} />
              </Route>
            </Routes>
          </Box>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
```
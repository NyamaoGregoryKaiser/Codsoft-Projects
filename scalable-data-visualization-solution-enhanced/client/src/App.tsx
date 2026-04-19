```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from 'contexts/AuthContext';

// Layout & Common Components
import Header from 'components/common/Header';
import ProtectedRoute from 'components/common/ProtectedRoute';

// Auth Pages
import Login from 'pages/Auth/Login';
import Register from 'pages/Auth/Register';

// Dashboard & Visualization Pages
import HomePage from 'pages/HomePage'; // A simple home page
import DatasetList from 'pages/Datasets/DatasetList';
import DatasetDetail from 'pages/Datasets/DatasetDetail';
import VisualizationBuilder from 'pages/Visualizations/VisualizationBuilder';
import VisualizationList from 'pages/Visualizations/VisualizationList';
import DashboardList from 'pages/Dashboards/DashboardList';
import DashboardEditor from 'pages/Dashboards/DashboardEditor';

const theme = createTheme({
  palette: {
    primary: {
      main: '#42a5f5', // Light blue
    },
    secondary: {
      main: '#66bb6a', // Light green
    },
    error: {
      main: '#ef5350', // Red
    },
    warning: {
      main: '#ffeb3b', // Yellow
    },
    info: {
      main: '#29b6f6', // Light blue
    },
    success: {
      main: '#66bb6a', // Light green
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      color: '#333',
    },
    h5: {
      fontWeight: 500,
      color: '#444',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase by default
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Header />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<HomePage />} />
              <Route path="/datasets" element={<DatasetList />} />
              <Route path="/datasets/new" element={<p>Upload Dataset page (redirected from DatasetList)</p>} /> {/* In a real app, this would be a dedicated upload form */}
              <Route path="/datasets/:id" element={<DatasetDetail />} />
              <Route path="/datasets/:id/edit" element={<p>Edit Dataset Metadata page</p>} /> {/* In a real app, this would be a dedicated edit form */}

              <Route path="/visualizations" element={<VisualizationList />} />
              <Route path="/visualizations/new" element={<VisualizationBuilder />} />
              <Route path="/visualizations/:id/edit" element={<VisualizationBuilder />} />

              <Route path="/dashboards" element={<DashboardList />} />
              <Route path="/dashboards/new" element={<DashboardEditor />} />
              <Route path="/dashboards/:id" element={<DashboardEditor />} />
              <Route path="/dashboards/:id/edit" element={<DashboardEditor />} />
            </Route>

            {/* Fallback for unknown routes */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <Typography variant="h4">404 - Page Not Found</Typography>
                <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.href = '/'}>Go to Home</Button>
              </div>
            } />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
```
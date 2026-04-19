```typescript
import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#2e3b4e' }}>
        Welcome to DataViz Hub!
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#555' }}>
        Empower your data with interactive visualizations and dynamic dashboards.
      </Typography>

      <Box sx={{ mt: 5 }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Get started by managing your datasets, creating compelling visualizations,
          or building insightful dashboards.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" size="large" component={Link} to="/datasets">
            Manage Datasets
          </Button>
          <Button variant="contained" size="large" component={Link} to="/visualizations">
            Build Visualizations
          </Button>
          <Button variant="contained" size="large" component={Link} to="/dashboards">
            Create Dashboards
          </Button>
        </Box>
      </Box>

      {user?.role === 'admin' && (
        <Box sx={{ mt: 8, p: 3, backgroundColor: '#fff3e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Admin Panel Access
          </Typography>
          <Typography variant="body1">
            As an administrator, you have enhanced control over user data and system settings.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} component={Link} to="/admin/users">
            Go to Admin Users
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default HomePage;
```
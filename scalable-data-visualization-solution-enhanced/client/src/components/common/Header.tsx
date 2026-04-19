```typescript
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#2e3b4e' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            DataViz Hub
          </Link>
        </Typography>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/datasets">
                Datasets
              </Button>
              <Button color="inherit" component={Link} to="/visualizations">
                Visualizations
              </Button>
              <Button color="inherit" component={Link} to="/dashboards">
                Dashboards
              </Button>
              <Typography color="inherit" sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                Hello, {user?.username} ({user?.role})
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
        {/* TODO: Add mobile menu toggle here */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
```
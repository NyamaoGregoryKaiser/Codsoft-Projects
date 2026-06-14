```tsx
import React from 'react';
import { Box, Typography, Container, Link as MuiLink } from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LoginForm />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <MuiLink component={Link} to="/register" variant="body2">
            Register
          </MuiLink>
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
```
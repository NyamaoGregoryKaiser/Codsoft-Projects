```tsx
import React, { useState } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { LoginRequest } from '../../types/auth';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<LoginRequest> = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await login(data);
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, maxWidth: 400, mx: 'auto', p: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Login
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Username or Email"
        {...register('usernameOrEmail', { required: 'Username or Email is required' })}
        error={!!errors.usernameOrEmail}
        helperText={errors.usernameOrEmail?.message}
        margin="normal"
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required' })}
        error={!!errors.password}
        helperText={errors.password?.message}
        margin="normal"
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2, py: 1.5 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
      </Button>
    </Box>
  );
};

export default LoginForm;
```
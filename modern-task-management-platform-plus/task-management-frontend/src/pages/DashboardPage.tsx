```tsx
import React from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import TaskList from '../components/dashboard/TaskList';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">You must be logged in to view the dashboard.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3" component="h1">
          Welcome, {user.username}!
        </Typography>
        <Button variant="contained" onClick={() => navigate('/tasks/new')}>
          Create New Task
        </Button>
      </Box>

      <TaskList assigneeId={user.id} />

      {/* Optionally, display projects, upcoming tasks, etc. */}
      {/* <Typography variant="h5" sx={{ mt: 6, mb: 2 }}>Upcoming Tasks</Typography>
      <TaskList assigneeId={user.id} status="PENDING" /> */}

      {/* <Typography variant="h5" sx={{ mt: 6, mb: 2 }}>Your Projects</Typography>
      <ProjectList ownerId={user.id} /> */}
    </Container>
  );
};

export default DashboardPage;
```
```tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid, Card, CardContent, Button, Chip, Stack } from '@mui/material';
import { getTasks, deleteTask } from '../../api/tasks';
import { Task } from '../../types/task';
import TaskCard from './TaskCard';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface TaskListProps {
  assigneeId?: string;
  projectId?: string;
  status?: string;
}

const TaskList: React.FC<TaskListProps> = ({ assigneeId, projectId, status }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        assigneeId: assigneeId || user?.id, // Default to current user's ID
        projectId,
        status,
      };
      const fetchedTasks = await getTasks(filters);
      setTasks(fetchedTasks);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks.');
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [assigneeId, projectId, status, user?.id]);

  useEffect(() => {
    if (user?.id) { // Ensure user is logged in before fetching
      fetchTasks();
    }
  }, [fetchTasks, user?.id]);

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete task.');
        console.error("Error deleting task:", err);
      }
    }
  };

  const handleEditTask = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">No tasks found.</Typography>
        <Button variant="contained" sx={{mt: 2}} onClick={() => navigate('/tasks/new')}>Create New Task</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Tasks</Typography>
      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={task.id}>
            <TaskCard task={task}>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditTask(task.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </Button>
              </Stack>
            </TaskCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskList;
```
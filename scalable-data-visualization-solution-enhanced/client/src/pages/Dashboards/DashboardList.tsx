```typescript
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Paper, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, Dashboard } from 'api/api';
import LoadingSpinner from 'components/common/LoadingSpinner';

const DashboardList: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getDashboards();
      setDashboards(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) {
      try {
        await dashboardApi.deleteDashboard(id);
        setDashboards(dashboards.filter((dashboard) => dashboard.id !== id));
        alert('Dashboard deleted successfully!');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete dashboard.');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Dashboards
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/dashboards/new')}>
          Create New Dashboard
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {dashboards.length === 0 ? (
        <Typography variant="h6" color="textSecondary" sx={{ mt: 4 }}>
          You haven't created any dashboards yet.
        </Typography>
      ) : (
        <List component={Paper} elevation={3}>
          {dashboards.map((dashboard) => (
            <ListItem
              key={dashboard.id}
              divider
              sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
            >
              <ListItemText
                primary={dashboard.name}
                secondary={`Visualizations: ${dashboard.layout.length} | Created: ${new Date(dashboard.createdAt).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="view" component={Link} to={`/dashboards/${dashboard.id}`}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton edge="end" aria-label="edit" component={Link} to={`/dashboards/${dashboard.id}/edit`}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(dashboard.id)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default DashboardList;
```
```typescript
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Paper, Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { visualizationApi, Visualization } from 'api/api';
import LoadingSpinner from 'components/common/LoadingSpinner';

const VisualizationList: React.FC = () => {
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchVisualizations = async () => {
    try {
      setLoading(true);
      const res = await visualizationApi.getVisualizations();
      setVisualizations(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch visualizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualizations();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this visualization? This action cannot be undone.')) {
      try {
        await visualizationApi.deleteVisualization(id);
        setVisualizations(visualizations.filter((viz) => viz.id !== id));
        alert('Visualization deleted successfully!');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete visualization.');
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
          My Visualizations
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/visualizations/new')}>
          Create New Visualization
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {visualizations.length === 0 ? (
        <Typography variant="h6" color="textSecondary" sx={{ mt: 4 }}>
          You haven't created any visualizations yet.
        </Typography>
      ) : (
        <List component={Paper} elevation={3}>
          {visualizations.map((viz) => (
            <ListItem
              key={viz.id}
              divider
              sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
            >
              <ListItemText
                primary={viz.name}
                secondary={`Type: ${viz.chartType.toUpperCase()} | Dataset: ${viz.dataset?.name || 'N/A'} | Created: ${new Date(viz.createdAt).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                {/* No separate view page, directly edit for now or show a modal */}
                {/* <IconButton edge="end" aria-label="view" component={Link} to={`/visualizations/${viz.id}/view`}>
                  <VisibilityIcon />
                </IconButton> */}
                <IconButton edge="end" aria-label="edit" component={Link} to={`/visualizations/${viz.id}/edit`}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(viz.id)}>
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

export default VisualizationList;
```
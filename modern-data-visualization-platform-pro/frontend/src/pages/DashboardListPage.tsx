import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Grid, Card, CardContent, CardActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { DashboardListItem } from '../types/dashboard';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * DashboardListPage component displays a list of user's dashboards and allows creating new ones.
 */
function DashboardListPage() {
  const { user } = useAuth();
  const { dashboards, fetchDashboards, deleteDashboard } = useData();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<DashboardListItem | null>(null);

  const loadDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchDashboards();
    } catch (err: any) {
      console.error('Failed to fetch dashboards:', err);
      setError(err.message || 'Failed to load dashboards.');
    } finally {
      setLoading(false);
    }
  }, [fetchDashboards]);

  useEffect(() => {
    if (user) {
      loadDashboards();
    }
  }, [user, loadDashboards]);

  const handleDeleteClick = (dashboard: DashboardListItem) => {
    setDashboardToDelete(dashboard);
    setOpenConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (dashboardToDelete) {
      try {
        await deleteDashboard(dashboardToDelete.id);
        setOpenConfirm(false);
        setDashboardToDelete(null);
        // Dashboards context should automatically update, but explicit reload can be done if needed
        await loadDashboards();
      } catch (err: any) {
        console.error('Failed to delete dashboard:', err);
        setError(err.message || 'Failed to delete dashboard.');
        setOpenConfirm(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Dashboards
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ mb: 4 }}
        onClick={() => navigate('/dashboards/new')} // Assuming a form/page for creating new dashboards
      >
        Create New Dashboard
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {dashboards.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4 }}>
          You don't have any dashboards yet. Start by creating one!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((dashboard) => (
            <Grid item xs={12} sm={6} md={4} key={dashboard.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {dashboard.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dashboard.description || 'No description provided.'}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                    Created: {new Date(dashboard.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button size="small" component={Link} to={`/dashboards/${dashboard.id}`}>
                    View
                  </Button>
                  <Button size="small" color="primary" onClick={() => navigate(`/dashboards/${dashboard.id}/edit`)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => handleDeleteClick(dashboard)}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmDialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Dashboard"
        message={`Are you sure you want to delete dashboard "${dashboardToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
}

export default DashboardListPage;
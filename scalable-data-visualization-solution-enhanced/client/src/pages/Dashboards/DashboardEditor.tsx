```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Paper, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton
} from '@mui/material';
import {
  Add as AddIcon, ArrowBack as ArrowBackIcon, Close as CloseIcon,
  Visibility as VisibilityIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { dashboardApi, visualizationApi, Dashboard, Visualization, DashboardLayoutItem } from 'api/api';
import LoadingSpinner from 'components/common/LoadingSpinner';
import ChartRenderer from 'components/charts/ChartRenderer';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // dashboard ID
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [layout, setLayout] = useState<Layout[]>([]); // Current grid layout
  const [visualizations, setVisualizations] = useState<Visualization[]>([]); // All user's visualizations
  const [dashboardVisualizations, setDashboardVisualizations] = useState<Visualization[]>([]); // Visualizations currently on the dashboard
  const [visualizationData, setVisualizationData] = useState<{ [vizId: string]: any }>({}); // Cached chart data

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addVizDialogOpen, setAddVizDialogOpen] = useState(false);
  const [selectedVizToAdd, setSelectedVizToAdd] = useState<string>('');

  const fetchDashboardAndVisualizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's visualizations for selection
      const allVizRes = await visualizationApi.getVisualizations();
      setVisualizations(allVizRes.data);

      if (id === 'new') {
        setDashboard(null);
        setName('');
        setDescription('');
        setLayout([]);
        setDashboardVisualizations([]);
      } else {
        const dashboardRes = await dashboardApi.getDashboardById(id!);
        setDashboard(dashboardRes.data);
        setName(dashboardRes.data.name);
        setDescription(dashboardRes.data.description || '');

        // Map layout items to React-Grid-Layout format
        const rglLayout: Layout[] = dashboardRes.data.layout.map(item => ({
          i: item.i, x: item.x, y: item.y, w: item.w, h: item.h,
          minW: 2, minH: 2 // Minimum size for a visualization
        }));
        setLayout(rglLayout);
        setDashboardVisualizations(dashboardRes.data.visualizations || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard or visualizations.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDashboardAndVisualizations();
  }, [fetchDashboardAndVisualizations]);

  useEffect(() => {
    // When dashboard visualizations change, pre-fetch their chart data
    const fetchChartData = async () => {
      const dataPromises = dashboardVisualizations.map(async (viz) => {
        if (!visualizationData[viz.id]) { // Only fetch if not already cached
          try {
            const res = await visualizationApi.getVisualizationData(viz.id);
            return { vizId: viz.id, data: res.data };
          } catch (err) {
            console.error(`Failed to fetch data for visualization ${viz.id}:`, err);
            return { vizId: viz.id, data: null };
          }
        }
        return { vizId: viz.id, data: visualizationData[viz.id] }; // Use cached data
      });

      const results = await Promise.all(dataPromises);
      const newData = results.reduce((acc, current) => {
        if (current) acc[current.vizId] = current.data;
        return acc;
      }, {});
      setVisualizationData(prev => ({ ...prev, ...newData }));
    };

    if (dashboardVisualizations.length > 0) {
      fetchChartData();
    }
  }, [dashboardVisualizations, visualizationData]); // Re-run if dashboardVisualizations change

  const onLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
  };

  const handleSaveDashboard = async () => {
    setSaving(true);
    setError(null);
    try {
      const apiLayout: DashboardLayoutItem[] = layout.map(item => ({
        i: item.i, x: item.x, y: item.y, w: item.w, h: item.h
      }));

      const dashboardData = {
        name,
        description,
        layout: apiLayout,
      };

      if (id === 'new') {
        const res = await dashboardApi.createDashboard(dashboardData);
        alert('Dashboard created successfully!');
        navigate(`/dashboards/${res.data.id}/edit`); // Redirect to edit mode of new dashboard
      } else {
        await dashboardApi.updateDashboard(id!, dashboardData);
        alert('Dashboard updated successfully!');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Failed to save dashboard.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVizToDashboard = async () => {
    if (!selectedVizToAdd) {
      setError('Please select a visualization.');
      return;
    }

    const vizToAdd = visualizations.find(viz => viz.id === selectedVizToAdd);
    if (!vizToAdd) {
      setError('Selected visualization not found.');
      return;
    }
    if (dashboardVisualizations.some(viz => viz.id === vizToAdd.id)) {
      setError('Visualization already added to this dashboard.');
      return;
    }

    // Add to local state first for immediate UI update
    setDashboardVisualizations(prev => [...prev, vizToAdd]);
    setLayout(prev => [...prev, {
      i: vizToAdd.id,
      x: (prev.length * 2) % 12, // Simple placement logic
      y: Infinity, // Places at the bottom
      w: 6,
      h: 4,
      minW: 2, minH: 2
    }]);

    setSelectedVizToAdd('');
    setAddVizDialogOpen(false);
    setError(null); // Clear any previous errors

    // Note: The actual backend update happens on "Save Dashboard"
  };

  const handleRemoveVizFromDashboard = (vizId: string) => {
    if (window.confirm('Are you sure you want to remove this visualization from the dashboard?')) {
      setDashboardVisualizations(prev => prev.filter(viz => viz.id !== vizId));
      setLayout(prev => prev.filter(item => item.i !== vizId));
      // Note: The actual backend update happens on "Save Dashboard"
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  const availableVisualizations = visualizations.filter(
    (viz) => !dashboardVisualizations.some((d_viz) => d_viz.id === viz.id)
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboards')}>
          Back to Dashboards
        </Button>
        <Typography variant="h4" component="h1">
          {id === 'new' ? 'Create New Dashboard' : `Edit Dashboard: ${name}`}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveDashboard}
          disabled={saving || !name}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {saving ? 'Saving...' : 'Save Dashboard'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <TextField
          label="Dashboard Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Description (Optional)"
          fullWidth
          margin="normal"
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Dashboard Layout</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddVizDialogOpen(true)}>
          Add Visualization
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 2, minHeight: 400 }}>
        {dashboardVisualizations.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography variant="h6" color="textSecondary">
              Add visualizations to your dashboard using the button above.
            </Typography>
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100} // Base height for a row
            onLayoutChange={onLayoutChange}
            isBounded={true} // Prevent items from being dragged outside the container
            // compactType="vertical" // Optional: compact items vertically
            useCSSTransforms={true}
          >
            {dashboardVisualizations.map((viz) => (
              <Box key={viz.id} data-grid={layout.find(item => item.i === viz.id)}
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: 'white'
                }}
              >
                <IconButton
                  sx={{ position: 'absolute', top: 5, right: 5, zIndex: 100, color: 'grey.700' }}
                  size="small"
                  onClick={() => handleRemoveVizFromDashboard(viz.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
                <Typography variant="subtitle1" sx={{ p: 1, backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
                  {viz.name} ({viz.chartType.toUpperCase()})
                </Typography>
                <Box sx={{ flexGrow: 1, p: 1, minHeight: 0 }}>
                  {visualizationData[viz.id] ? (
                    <ChartRenderer visualization={viz} chartData={visualizationData[viz.id]} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress size={30} />
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </ResponsiveGridLayout>
        )}
      </Paper>

      <Dialog open={addVizDialogOpen} onClose={() => setAddVizDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Visualization to Dashboard</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="select-visualization-label">Select Visualization</InputLabel>
            <Select
              labelId="select-visualization-label"
              id="select-visualization"
              value={selectedVizToAdd}
              label="Select Visualization"
              onChange={(e) => setSelectedVizToAdd(e.target.value as string)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {availableVisualizations.length === 0 && (
                <MenuItem disabled>No available visualizations to add.</MenuItem>
              )}
              {availableVisualizations.map((viz) => (
                <MenuItem key={viz.id} value={viz.id}>
                  {viz.name} ({viz.chartType.toUpperCase()})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddVizDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddVizToDashboard} disabled={!selectedVizToAdd}>Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardEditor;
```
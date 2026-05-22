```tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '@/contexts/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import apiClient from '@/api';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  owner: { id: string; name: string };
  createdAt: string;
}

const ProjectsList: React.FC = () => {
  const { user } = useAuth();
  const { data: projects, loading, error, refetch } = useFetch<{ projects: Project[] }>(`/projects`);
  const navigate = useNavigate();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreateDialog = () => {
    setProjectName('');
    setProjectDescription('');
    setFormError(null);
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    setFormError(null);
    try {
      await apiClient.post('/projects', { name: projectName, description: projectDescription });
      handleCloseCreateDialog();
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleOpenEditDialog = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setFormError(null);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentProject(null);
  };

  const handleUpdateProject = async () => {
    if (!currentProject || !projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    setFormError(null);
    try {
      await apiClient.patch(`/projects/${currentProject.id}`, {
        name: projectName,
        description: projectDescription,
      });
      handleCloseEditDialog();
      refetch();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await apiClient.delete(`/projects/${id}`);
        refetch();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete project');
      }
    }
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
      <Alert severity="error" sx={{ mt: 4 }}>
        Error: {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Your Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          New Project
        </Button>
      </Box>

      {projects?.projects.length === 0 ? (
        <Typography variant="h6" color="text.secondary">
          No projects found. Start by creating a new one!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {projects?.projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.description || 'No description provided.'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Owner: {project.owner.name}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>
                    View Details
                  </Button>
                  {project.owner.id === user?.id && ( // Only owner can edit/delete
                    <>
                      <IconButton size="small" onClick={() => handleOpenEditDialog(project)} color="info">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteProject(project.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="standard"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={!!formError}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="standard"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="standard"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            error={!!formError}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="standard"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateProject} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectsList;
```
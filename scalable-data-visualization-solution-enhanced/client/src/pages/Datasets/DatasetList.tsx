```typescript
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Paper, Alert, TextField, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { datasetApi, Dataset } from 'api/api';
import LoadingSpinner from 'components/common/LoadingSpinner';

const DatasetList: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await datasetApi.getDatasets();
      setDatasets(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !newDatasetName) {
      setError('Please provide a name and select a file.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', newDatasetName);
      if (newDatasetDescription) {
        formData.append('description', newDatasetDescription);
      }
      formData.append('file', file);

      await datasetApi.uploadDataset(formData);
      setNewDatasetName('');
      setNewDatasetDescription('');
      setFile(null);
      await fetchDatasets();
      alert('Dataset uploaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dataset?')) {
      try {
        await datasetApi.deleteDataset(id);
        setDatasets(datasets.filter((dataset) => dataset.id !== id));
        alert('Dataset deleted successfully!');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete dataset.');
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
          My Datasets
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/datasets/new')}>
          Upload Dataset
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Simplified upload form for demonstration purposes, actual page at /datasets/new */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Quick Upload New Dataset</Typography>
        <TextField
          label="Dataset Name"
          fullWidth
          margin="normal"
          value={newDatasetName}
          onChange={(e) => setNewDatasetName(e.target.value)}
        />
        <TextField
          label="Description (Optional)"
          fullWidth
          margin="normal"
          value={newDatasetDescription}
          onChange={(e) => setNewDatasetDescription(e.target.value)}
        />
        <Button
          variant="outlined"
          component="label"
          sx={{ mt: 2, mr: 2 }}
        >
          {file ? file.name : 'Choose File (CSV/JSON)'}
          <input type="file" hidden onChange={handleFileChange} accept=".csv,.json" />
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={uploading || !file || !newDatasetName}
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          sx={{ mt: 2 }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Paper>

      {datasets.length === 0 ? (
        <Typography variant="h6" color="textSecondary" sx={{ mt: 4 }}>
          You haven't uploaded any datasets yet.
        </Typography>
      ) : (
        <List component={Paper} elevation={3}>
          {datasets.map((dataset) => (
            <ListItem
              key={dataset.id}
              divider
              sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
            >
              <ListItemText
                primary={dataset.name}
                secondary={`Type: ${dataset.fileType.toUpperCase()} | Uploaded: ${new Date(dataset.createdAt).toLocaleDateString()}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="view" component={Link} to={`/datasets/${dataset.id}`}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton edge="end" aria-label="edit" component={Link} to={`/datasets/${dataset.id}/edit`}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(dataset.id)}>
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

export default DatasetList;
```
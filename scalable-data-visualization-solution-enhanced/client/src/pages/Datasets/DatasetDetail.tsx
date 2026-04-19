```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Paper, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { datasetApi, Dataset, FileType } from 'api/api';
import LoadingSpinner from 'components/common/LoadingSpinner';

const DatasetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDataset = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await datasetApi.getDatasetById(id);
        setDataset(res.data);

        // Fetch and parse data separately for display
        const dataRes = await datasetApi.getDatasetData(id);
        setParsedData(dataRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dataset details or data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDataset();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      setDeleting(true);
      setError(null);
      try {
        if (id) {
          await datasetApi.deleteDataset(id);
          alert('Dataset deleted successfully!');
          navigate('/datasets');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete dataset.');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/datasets')}>
          Back to Datasets
        </Button>
      </Container>
    );
  }

  if (!dataset) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6">Dataset not found.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/datasets')}>
          Back to Datasets
        </Button>
      </Container>
    );
  }

  const renderDataTable = () => {
    if (!parsedData || parsedData.length === 0) {
      return <Typography sx={{ mt: 2 }}>No data to display.</Typography>;
    }

    const headers = Object.keys(parsedData[0]);

    return (
      <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header} sx={{ fontWeight: 'bold' }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {parsedData.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={`${index}-${header}`}>{row[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/datasets')}>
          Back to Datasets
        </Button>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/datasets/${dataset.id}/edit`)}
            sx={{ mr: 1 }}
          >
            Edit Metadata
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {dataset.name}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          ID: {dataset.id}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          **Description:** {dataset.description || 'N/A'}
        </Typography>
        <Typography variant="body1">
          **File Type:** {dataset.fileType.toUpperCase()}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Uploaded: {new Date(dataset.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Last Updated: {new Date(dataset.updatedAt).toLocaleString()}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Raw Data Preview ({parsedData.length} rows)
          </Typography>
          {renderDataTable()}
        </Box>
      </Paper>
    </Container>
  );
};

export default DatasetDetail;
```
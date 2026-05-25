import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDatasetById, updateDataset, deleteDataset } from '@api/datasets';

interface Dataset {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

const DatasetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDataset, setEditedDataset] = useState<Partial<Dataset>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (id) {
      loadDataset(id);
    }
  }, [id]);

  const loadDataset = async (datasetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDatasetById(datasetId);
      setDataset(data);
      setEditedDataset({ name: data.name, description: data.description });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dataset details');
      toast({
        title: 'Error loading dataset.',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateDataset(id, editedDataset);
      toast({
        title: 'Dataset updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
      await loadDataset(id); // Reload data to reflect changes
    } catch (err: any) {
      toast({
        title: 'Update failed.',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) return;

    try {
      await deleteDataset(id);
      toast({
        title: 'Dataset deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/datasets'); // Go back to the datasets list
    } catch (err: any) {
      toast({
        title: 'Deletion failed.',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error || !dataset) {
    return (
      <Alert status="error" mt={4}>
        <AlertIcon />
        {error || 'Dataset not found.'}
        <Button ml={4} onClick={() => navigate('/datasets')}>
            Back to Datasets
        </Button>
      </Alert>
    );
  }

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <Flex mb={6} alignItems="center">
        <Heading as="h1" size="xl">
          Dataset: {dataset.name}
        </Heading>
        <Spacer />
        {isEditing ? (
          <Button colorScheme="green" onClick={handleUpdate} isLoading={isSubmitting} mr={2}>
            Save Changes
          </Button>
        ) : (
          <Button colorScheme="blue" onClick={() => setIsEditing(true)} mr={2}>
            Edit Dataset
          </Button>
        )}
        <Button colorScheme="red" onClick={handleDelete} isLoading={isSubmitting}>
          Delete Dataset
        </Button>
      </Flex>

      <VStack spacing={4} align="stretch" bg="white" p={6} borderRadius="lg" boxShadow="md">
        <FormControl>
          <FormLabel>Name</FormLabel>
          {isEditing ? (
            <Input
              value={editedDataset.name}
              onChange={(e) => setEditedDataset({ ...editedDataset, name: e.target.value })}
            />
          ) : (
            <Text>{dataset.name}</Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          {isEditing ? (
            <Textarea
              value={editedDataset.description}
              onChange={(e) => setEditedDataset({ ...editedDataset, description: e.target.value })}
            />
          ) : (
            <Text>{dataset.description || 'No description provided.'}</Text>
          )}
        </FormControl>

        <FormControl>
          <FormLabel>File Path</FormLabel>
          <Text fontFamily="monospace">{dataset.filePath}</Text>
        </FormControl>

        <FormControl>
          <FormLabel>File Size</FormLabel>
          <Text>{dataset.fileSizeBytes ? `${(dataset.fileSizeBytes / 1024).toFixed(2)} KB` : 'N/A'}</Text>
        </FormControl>

        <FormControl>
          <FormLabel>MIME Type</FormLabel>
          <Text>{dataset.mimeType || 'N/A'}</Text>
        </FormControl>

        <FormControl>
          <FormLabel>Uploaded At</FormLabel>
          <Text>{new Date(dataset.uploadedAt).toLocaleString()}</Text>
        </FormControl>

        <FormControl>
          <FormLabel>Last Updated</FormLabel>
          <Text>{new Date(dataset.updatedAt).toLocaleString()}</Text>
        </FormControl>

        <Button mt={4} onClick={() => navigate('/datasets')}>
          Back to All Datasets
        </Button>
      </VStack>
    </Box>
  );
};

export default DatasetDetailPage;
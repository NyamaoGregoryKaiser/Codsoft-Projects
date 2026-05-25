import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { AddIcon } from '@chakra-ui/icons';
import { fetchDatasets, createDataset, deleteDataset } from '@api/datasets';

interface Dataset {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
  uploadedAt: string;
}

const DatasetsPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: '',
    description: '',
    filePath: '', // For demo, directly input path
    fileSizeBytes: 0,
    mimeType: 'text/csv',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDatasets();
      setDatasets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch datasets');
      toast({
        title: 'Error loading datasets.',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async () => {
    setIsSubmitting(true);
    try {
      await createDataset(newDataset);
      toast({
        title: 'Dataset created.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsModalOpen(false);
      setNewDataset({ name: '', description: '', filePath: '', fileSizeBytes: 0, mimeType: 'text/csv' });
      await loadDatasets(); // Reload list after creation
    } catch (err: any) {
      toast({
        title: 'Creation failed.',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) return;

    try {
      await deleteDataset(id);
      toast({
        title: 'Dataset deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await loadDatasets();
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

  if (error) {
    return (
      <Alert status="error" mt={4}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <Flex mb={6} alignItems="center">
        <Heading as="h1" size="xl">
          Your Datasets
        </Heading>
        <Spacer />
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => setIsModalOpen(true)}>
          Add New Dataset
        </Button>
      </Flex>

      {datasets.length === 0 ? (
        <Text fontSize="lg" color="gray.600" textAlign="center" mt={10}>
          You haven't added any datasets yet. Click "Add New Dataset" to get started!
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {datasets.map((dataset) => (
            <Card key={dataset.id} variant="outline" _hover={{ boxShadow: 'lg' }}>
              <CardHeader>
                <Heading size="md">{dataset.name}</Heading>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" color="gray.600">
                  {dataset.description || 'No description provided.'}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Uploaded: {new Date(dataset.uploadedAt).toLocaleDateString()}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Size: {dataset.fileSizeBytes ? `${(dataset.fileSizeBytes / 1024).toFixed(2)} KB` : 'N/A'}
                </Text>
              </CardBody>
              <CardFooter justifyContent="flex-end">
                <Button as={RouterLink} to={`/datasets/${dataset.id}`} colorScheme="blue" size="sm" mr={2}>
                  View Details
                </Button>
                <Button colorScheme="red" size="sm" onClick={() => handleDeleteDataset(dataset.id)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Dataset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Dataset Name</FormLabel>
                <Input
                  value={newDataset.name}
                  onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                  placeholder="e.g., Customer Churn Data"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newDataset.description}
                  onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                  placeholder="A brief description of the dataset..."
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>File Path (e.g., S3 URL, local path)</FormLabel>
                <Input
                  value={newDataset.filePath}
                  onChange={(e) => setNewDataset({ ...newDataset, filePath: e.target.value })}
                  placeholder="https://your-storage.com/data.csv"
                />
              </FormControl>
              <FormControl>
                <FormLabel>File Size (bytes)</FormLabel>
                <Input
                  type="number"
                  value={newDataset.fileSizeBytes}
                  onChange={(e) => setNewDataset({ ...newDataset, fileSizeBytes: parseInt(e.target.value, 10) || 0 })}
                  placeholder="e.g., 102400"
                />
              </FormControl>
              <FormControl>
                <FormLabel>MIME Type</FormLabel>
                <Input
                  value={newDataset.mimeType}
                  onChange={(e) => setNewDataset({ ...newDataset, mimeType: e.target.value })}
                  placeholder="e.g., text/csv"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateDataset} isLoading={isSubmitting}>
              Create Dataset
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DatasetsPage;
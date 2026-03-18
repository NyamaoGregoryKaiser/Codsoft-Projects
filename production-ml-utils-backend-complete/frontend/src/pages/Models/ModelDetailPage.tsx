import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  Button,
  Flex,
  useToast,
  Badge,
  Code,
  Divider,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { MLModel, UpdateModelPayload } from '../../types/model';

const ModelDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [model, setModel] = useState<MLModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for editing
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editStatus, setEditStatus] = useState<MLModel['status']>('draft');
  const [editMetadata, setEditMetadata] = useState('');

  const fetchModel = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ status: string; data: MLModel }>(`/models/${id}`);
      if (response.data.status === 'success') {
        const fetchedModel = response.data.data;
        setModel(fetchedModel);
        // Initialize edit form with fetched data
        setEditName(fetchedModel.name);
        setEditDescription(fetchedModel.description);
        setEditVersion(fetchedModel.version);
        setEditPath(fetchedModel.model_path || '');
        setEditStatus(fetchedModel.status);
        setEditMetadata(JSON.stringify(fetchedModel.metadata, null, 2));
      } else {
        setError(response.data.status);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch model details.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  const handleUpdateModel = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      const payload: UpdateModelPayload = {
        name: editName,
        description: editDescription,
        version: editVersion,
        model_path: editPath,
        status: editStatus,
      };

      // Only add metadata if it's valid JSON
      try {
        if (editMetadata.trim()) {
          payload.metadata = JSON.parse(editMetadata);
        }
      } catch (jsonError) {
        throw new Error("Invalid JSON format for metadata.");
      }

      const response = await api.put<{ status: string; data: MLModel }>(`/models/${id}`, payload);
      if (response.data.status === 'success') {
        setModel(response.data.data);
        toast({
          title: 'Model Updated',
          description: 'Model details have been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose(); // Close the modal
      } else {
        setError(response.data.status);
      }
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'Failed to update model.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'green';
      case 'ready': return 'blue';
      case 'training': return 'orange';
      case 'draft': return 'gray';
      case 'archived': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" h="70vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" m={8}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!model) {
    return (
      <Box p={8}>
        <Text>Model not found.</Text>
        <Button onClick={() => navigate('/models')} mt={4}>Back to Models</Button>
      </Box>
    );
  }

  return (
    <Box p={8} maxW="4xl" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl" color="brand.700">{model.name}</Heading>
        <Flex>
          <Button colorScheme="yellow" onClick={onOpen} mr={4}>
            Edit Model
          </Button>
          <Button onClick={() => navigate('/models')} variant="outline">
            Back to Models
          </Button>
        </Flex>
      </Flex>

      <VStack align="stretch" spacing={5} bg="white" p={6} borderRadius="lg" boxShadow="md">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="flex-start">
          <Text fontWeight="bold">Status:</Text>
          <Badge colorScheme={getStatusColor(model.status)} fontSize="0.9em" p={1} borderRadius="md">
            {model.status.toUpperCase()}
          </Badge>
        </Stack>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Text fontWeight="bold">Description:</Text>
          <Text>{model.description || 'No description provided.'}</Text>
        </Stack>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Text fontWeight="bold">Version:</Text>
          <Text>{model.version}</Text>
        </Stack>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Text fontWeight="bold">Model Path:</Text>
          <Text>{model.model_path || 'Not specified'}</Text>
        </Stack>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Text fontWeight="bold">Created At:</Text>
          <Text>{new Date(model.created_at).toLocaleString()}</Text>
        </Stack>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Text fontWeight="bold">Last Updated:</Text>
          <Text>{new Date(model.updated_at).toLocaleString()}</Text>
        </Stack>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Text fontWeight="bold">Owned by User ID:</Text>
          <Code>{model.user_id}</Code>
        </Stack>

        <Divider />

        <Heading as="h3" size="md" mt={4} mb={2}>Metadata</Heading>
        <Code p={4} w="full" overflowX="auto" borderRadius="md">
          <pre>{JSON.stringify(model.metadata, null, 2)}</pre>
        </Code>
      </VStack>

      {/* Edit Model Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Model: {model.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Model Name</FormLabel>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Version</FormLabel>
                <Input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Model Path</FormLabel>
                <Input value={editPath} onChange={(e) => setEditPath(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as MLModel['status'])}>
                  <option value="draft">Draft</option>
                  <option value="training">Training</option>
                  <option value="ready">Ready</option>
                  <option value="deployed">Deployed</option>
                  <option value="archived">Archived</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Metadata (JSON)</FormLabel>
                <Textarea
                  value={editMetadata}
                  onChange={(e) => setEditMetadata(e.target.value)}
                  fontFamily="monospace"
                  minH="150px"
                  isInvalid={
                    (() => {
                        try {
                            if (editMetadata.trim() === '') return false;
                            JSON.parse(editMetadata);
                            return false;
                        } catch (e) {
                            return true;
                        }
                    })()
                  }
                />
                {
                    (() => {
                        try {
                            if (editMetadata.trim() === '') return null;
                            JSON.parse(editMetadata);
                            return null;
                        } catch (e) {
                            return <Text color="red.500" fontSize="sm">Invalid JSON format</Text>;
                        }
                    })()
                }
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateModel} isLoading={isUpdating}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ModelDetailPage;
```
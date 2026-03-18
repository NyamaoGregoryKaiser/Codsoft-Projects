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
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { MLModel } from '../../types/model';

const ModelsPage = () => {
  const [models, setModels] = useState<MLModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ status: string; data: MLModel[] }>('/models');
      if (response.data.status === 'success') {
        setModels(response.data.data);
      } else {
        setError(response.data.status);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch models.';
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
  }, [toast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      await api.delete(`/models/${modelId}`);
      toast({
        title: 'Model Deleted',
        description: 'Model has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchModels(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete model.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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

  return (
    <Box p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl" color="brand.700">Your ML Models</Heading>
        <Button as={RouterLink} to="/models/upload" colorScheme="brand" leftIcon={<AddIcon />}>
          Upload New Model
        </Button>
      </Flex>

      {models.length === 0 ? (
        <VStack spacing={4} mt={10} p={8} bg="white" borderRadius="lg" boxShadow="md" maxW="xl" mx="auto">
          <Text fontSize="lg">No models found.</Text>
          <Text>Start by uploading your first machine learning model!</Text>
          <Button as={RouterLink} to="/models/upload" colorScheme="brand" leftIcon={<AddIcon />}>
            Upload Model Now
          </Button>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {models.map((model) => (
            <Card key={model.id} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md" _hover={{ boxShadow: "lg" }}>
              <CardHeader pb={0}>
                <Flex align="center">
                  <Heading size="md">{model.name}</Heading>
                  <Spacer />
                  <Badge colorScheme={getStatusColor(model.status)} fontSize="0.8em">
                    {model.status.toUpperCase()}
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" color="gray.600" mb={2}>{model.description || 'No description provided.'}</Text>
                <Text fontSize="xs" color="gray.500">Version: {model.version}</Text>
                <Text fontSize="xs" color="gray.500">Last Updated: {new Date(model.updated_at).toLocaleDateString()}</Text>
              </CardBody>
              <CardFooter pt={0}>
                <Flex justifyContent="space-around" width="100%">
                  <Tooltip label="View Details">
                    <IconButton
                      aria-label="View model"
                      icon={<ViewIcon />}
                      onClick={() => navigate(`/models/${model.id}`)}
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </Tooltip>
                  <Tooltip label="Edit Model">
                    <IconButton
                      aria-label="Edit model"
                      icon={<EditIcon />}
                      onClick={() => navigate(`/models/${model.id}/edit`)} // Placeholder for edit page
                      colorScheme="yellow"
                      variant="ghost"
                    />
                  </Tooltip>
                  <Tooltip label="Delete Model">
                    <IconButton
                      aria-label="Delete model"
                      icon={<DeleteIcon />}
                      onClick={() => handleDeleteModel(model.id)}
                      colorScheme="red"
                      variant="ghost"
                    />
                  </Tooltip>
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default ModelsPage;
```
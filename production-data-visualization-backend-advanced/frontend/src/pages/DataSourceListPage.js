import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Stack,
  Flex,
  Spacer,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api/apiClient';

function DataSourceListPage() {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchDataSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/data-sources');
      setDataSources(response.data.data.dataSources);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data sources.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load data sources.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  const handleDeleteDataSource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this data source? All linked charts will be affected.')) return;

    try {
      await apiClient.delete(`/data-sources/${id}`);
      setDataSources(dataSources.filter((ds) => ds.id !== id));
      toast({
        title: 'Data Source Deleted',
        description: 'Data source has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete data source.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete data source.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box p={4}>
      <Flex mb={6} align="center">
        <Heading as="h1" size="xl">Your Data Sources</Heading>
        <Spacer />
        <Button as={RouterLink} to="/data-sources/new" colorScheme="brand" leftIcon={<AddIcon />}>
          Add New Data Source
        </Button>
      </Flex>

      {dataSources.length === 0 ? (
        <Text fontSize="lg" color="gray.500">
          No data sources configured yet. Add a new one to get started!
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {dataSources.map((ds) => (
            <Card key={ds.id} boxShadow="md" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Flex align="center">
                  <Heading size="md">{ds.name}</Heading>
                  <Spacer />
                  <Stack direction="row" spacing={2}>
                    {/* Optionally, a button to view raw data or test connection */}
                    <IconButton
                      icon={<ExternalLinkIcon />}
                      aria-label="View Data"
                      colorScheme="blue"
                      size="sm"
                      onClick={() => toast({
                        title: 'Feature coming soon',
                        description: 'Viewing raw data is not fully implemented in the demo.',
                        status: 'info',
                        duration: 3000,
                        isClosable: true,
                      })}
                    />
                    <IconButton
                      as={RouterLink}
                      to={`/data-sources/${ds.id}/edit`}
                      icon={<EditIcon />}
                      aria-label="Edit Data Source"
                      colorScheme="yellow"
                      size="sm"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      aria-label="Delete Data Source"
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteDataSource(ds.id)}
                    />
                  </Stack>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <Text fontSize="sm" color="gray.600">Type: {ds.type.replace(/_/g, ' ').toUpperCase()}</Text>
                {ds.config.description && (
                  <Text fontSize="sm" color="gray.500" mt={1}>Desc: {ds.config.description}</Text>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default DataSourceListPage;
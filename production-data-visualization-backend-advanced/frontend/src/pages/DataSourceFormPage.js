import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Textarea,
  VStack,
  useToast,
  Flex,
  Spacer,
  Spinner,
  Alert,
  AlertIcon,
  Select,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const dataSourceTypes = ['csv_upload', 'api_endpoint', 'database_query', 'mock_data'];

function DataSourceFormPage() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('mock_data');
  const [config, setConfig] = useState(''); // JSON string for config object

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!id;

  const fetchDataSource = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        const response = await apiClient.get(`/data-sources/${id}`);
        const fetchedDataSource = response.data.data.dataSource;
        setName(fetchedDataSource.name);
        setType(fetchedDataSource.type);
        setConfig(JSON.stringify(fetchedDataSource.config, null, 2));
      } else {
        // Default config for new mock data source
        setConfig(JSON.stringify({
          description: 'Sample mock data for demonstration.',
          data: [
            { label: 'Category A', value: 100 },
            { label: 'Category B', value: 200 },
            { label: 'Category C', value: 150 },
          ],
          columns: ['label', 'value'],
        }, null, 2));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data source.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load data source.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, toast]);

  useEffect(() => {
    fetchDataSource();
  }, [fetchDataSource]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let parsedConfig;
    try {
      parsedConfig = JSON.parse(config);
    } catch (parseError) {
      setError('Invalid JSON in configuration. Please check the syntax.');
      setSaving(false);
      return;
    }

    const dataSourceData = {
      name,
      type,
      config: parsedConfig,
    };

    try {
      if (isEditMode) {
        await apiClient.put(`/data-sources/${id}`, dataSourceData);
        toast({
          title: 'Data Source Updated',
          description: 'Data source has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await apiClient.post('/data-sources', dataSourceData);
        toast({
          title: 'Data Source Created',
          description: 'Data source has been successfully created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      navigate('/data-sources');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} data source.`);
      toast({
        title: 'Error',
        description: err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} data source.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
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
        <Heading as="h1" size="xl">{isEditMode ? 'Edit Data Source' : 'Add New Data Source'}</Heading>
        <Spacer />
        <Button
          type="submit"
          form="datasource-form"
          colorScheme="brand"
          isLoading={saving}
          loadingText={isEditMode ? 'Updating...' : 'Creating...'}
        >
          {isEditMode ? 'Save Data Source' : 'Create Data Source'}
        </Button>
      </Flex>

      <Box p={6} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm">
        <form id="datasource-form" onSubmit={handleSubmit}>
          <FormControl isRequired mb={4}>
            <FormLabel>Data Source Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Data, API Sales"
            />
          </FormControl>
          <FormControl isRequired mb={4}>
            <FormLabel>Data Source Type</FormLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {dataSourceTypes.map(dsType => (
                <option key={dsType} value={dsType}>{dsType.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </Select>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Configuration (JSON)</FormLabel>
            <Textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder={`{\n  "apiUrl": "https://api.example.com/data",\n  "headers": { "Authorization": "Bearer token" }\n}`}
              fontFamily="mono"
              minH="200px"
            />
            {error && error.includes('JSON') && ( // Display JSON parsing error specifically
              <Text color="red.500" fontSize="sm" mt={1}>{error}</Text>
            )}
            <Text fontSize="sm" color="gray.500" mt={1}>
              Provide configuration details based on the data source type (e.g., `data` array for mock_data, `apiUrl` for api_endpoint).
            </Text>
          </FormControl>
        </form>
      </Box>
    </Box>
  );
}

export default DataSourceFormPage;
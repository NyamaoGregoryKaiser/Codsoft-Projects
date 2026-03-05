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
import ChartRenderer from '../components/ChartRenderer';

const chartTypes = ['bar', 'line', 'pie', 'area', 'scatter', 'table'];

function ChartBuilderPage() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const toast = useToast();

  const [chartName, setChartName] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [dataSourceId, setDataSourceId] = useState('');
  const [chartConfig, setChartConfig] = useState(''); // JSON string for Echarts config

  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!id;

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sourcesResponse = await apiClient.get('/data-sources');
      setDataSources(sourcesResponse.data.data.dataSources);

      if (isEditMode) {
        const chartResponse = await apiClient.get(`/charts/${id}`);
        const fetchedChart = chartResponse.data.data.chart;
        setChartName(fetchedChart.name);
        setChartDescription(fetchedChart.description || '');
        setChartType(fetchedChart.type);
        setDataSourceId(fetchedChart.dataSourceId);
        setChartConfig(JSON.stringify(fetchedChart.config, null, 2));
      } else {
        // Set default config for new chart if no template exists
        setChartConfig(JSON.stringify({
          title: { text: 'New Chart' },
          tooltip: {},
          xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          yAxis: { type: 'value' },
          series: [{
            name: 'Value',
            type: 'bar',
            data: [120, 200, 150, 80, 70, 110, 130]
          }]
        }, null, 2));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load initial data.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load initial data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, toast]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let parsedConfig;
    try {
      parsedConfig = JSON.parse(chartConfig);
    } catch (parseError) {
      setError('Invalid JSON in chart configuration.');
      setSaving(false);
      return;
    }

    const chartData = {
      name: chartName,
      description: chartDescription,
      type: chartType,
      dataSourceId: dataSourceId,
      config: parsedConfig,
    };

    try {
      if (isEditMode) {
        await apiClient.put(`/charts/${id}`, chartData);
        toast({
          title: 'Chart Updated',
          description: 'Chart has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await apiClient.post('/charts', chartData);
        toast({
          title: 'Chart Created',
          description: 'Chart has been successfully created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      navigate('/charts');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} chart.`);
      toast({
        title: 'Error',
        description: err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} chart.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const getChartConfigPreview = () => {
    try {
      return JSON.parse(chartConfig);
    } catch {
      return {};
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
        <Heading as="h1" size="xl">{isEditMode ? 'Edit Chart' : 'Create New Chart'}</Heading>
        <Spacer />
        <Button
          type="submit"
          form="chart-form"
          colorScheme="brand"
          isLoading={saving}
          loadingText={isEditMode ? 'Updating...' : 'Creating...'}
        >
          {isEditMode ? 'Save Chart' : 'Create Chart'}
        </Button>
      </Flex>

      <VStack spacing={8} align="stretch">
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm">
          <Heading size="lg" mb={4}>Chart Details</Heading>
          <form id="chart-form" onSubmit={handleSubmit}>
            <FormControl isRequired mb={4}>
              <FormLabel>Chart Name</FormLabel>
              <Input
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                placeholder="e.g., Monthly Sales Bar Chart"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={chartDescription}
                onChange={(e) => setChartDescription(e.target.value)}
                placeholder="A brief description of this chart."
              />
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Chart Type</FormLabel>
              <Select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                {chartTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Data Source</FormLabel>
              <Select
                value={dataSourceId}
                onChange={(e) => setDataSourceId(e.target.value)}
                placeholder="Select a data source"
              >
                {dataSources.map(source => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel>Echarts Configuration (JSON)</FormLabel>
              <Textarea
                value={chartConfig}
                onChange={(e) => setChartConfig(e.target.value)}
                placeholder={`{\n  "title": { "text": "My Chart" },\n  "xAxis": { "type": "category", "data": [] },\n  "yAxis": { "type": "value" },\n  "series": [{ "type": "bar", "data": [] }]\n}`}
                fontFamily="mono"
                minH="300px"
              />
              {error && error.includes('JSON') && ( // Display JSON parsing error specifically
                <Text color="red.500" fontSize="sm" mt={1}>{error}</Text>
              )}
            </FormControl>
          </form>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm">
          <Heading size="lg" mb={4}>Chart Preview</Heading>
          {dataSourceId ? (
            <ChartRenderer chartId={id || 'new'} // Use actual ID if editing, otherwise a dummy ID
              height="400px" title={chartName} />
          ) : (
            <Flex align="center" justify="center" h="400px" borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text color="gray.500">Please select a data source and configure the chart to see a preview.</Text>
            </Flex>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

export default ChartBuilderPage;
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
  SimpleGrid,
  Checkbox,
  Stack,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ChartRenderer from '../components/ChartRenderer';
import { AddIcon } from '@chakra-ui/icons';

const ResponsiveGridLayout = WidthProvider(Responsive);

function DashboardBuilderPage() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const toast = useToast();

  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [layout, setLayout] = useState([]); // [{ i: chartId, x, y, w, h }]
  const [availableCharts, setAvailableCharts] = useState([]);
  const [selectedChartIds, setSelectedChartIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!id;

  const fetchDashboardAndCharts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all available charts
      const chartsResponse = await apiClient.get('/charts');
      setAvailableCharts(chartsResponse.data.data.charts);

      if (isEditMode) {
        // Fetch existing dashboard
        const dashboardResponse = await apiClient.get(`/dashboards/${id}`);
        const fetchedDashboard = dashboardResponse.data.data.dashboard;
        setDashboardName(fetchedDashboard.name);
        setDashboardDescription(fetchedDashboard.description);

        const initialLayout = fetchedDashboard.layout || [];
        setLayout(initialLayout);

        const initialSelectedChartIds = new Set(initialLayout.map(item => item.i));
        setSelectedChartIds(initialSelectedChartIds);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data for dashboard builder.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, toast]);

  useEffect(() => {
    fetchDashboardAndCharts();
  }, [fetchDashboardAndCharts]);


  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const handleChartSelectionChange = (chartId, isChecked) => {
    setSelectedChartIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(chartId);
        // Add new chart to layout with default position
        const existingChartInLayout = layout.find(item => item.i === chartId);
        if (!existingChartInLayout) {
          setLayout(prevLayout => [
            ...prevLayout,
            { i: chartId, x: (prevLayout.length * 2) % 12, y: Infinity, w: 6, h: 6 }, // 'y: Infinity' makes it go to the next available row
          ]);
        }
      } else {
        newSet.delete(chartId);
        // Remove chart from layout
        setLayout(prevLayout => prevLayout.filter(item => item.i !== chartId));
      }
      return newSet;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dashboardData = {
      name: dashboardName,
      description: dashboardDescription,
      layout: layout,
    };

    try {
      if (isEditMode) {
        await apiClient.put(`/dashboards/${id}`, dashboardData);
        toast({
          title: 'Dashboard Updated',
          description: 'Dashboard has been successfully updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await apiClient.post('/dashboards', dashboardData);
        toast({
          title: 'Dashboard Created',
          description: 'Dashboard has been successfully created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      navigate('/dashboards');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} dashboard.`);
      toast({
        title: 'Error',
        description: err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} dashboard.`,
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

  const chartsToRender = availableCharts.filter(chart => selectedChartIds.has(chart.id));
  const currentLayout = layout.filter(item => selectedChartIds.has(item.i)); // Only render selected charts

  return (
    <Box p={4}>
      <Flex mb={6} align="center">
        <Heading as="h1" size="xl">{isEditMode ? 'Edit Dashboard' : 'Create New Dashboard'}</Heading>
        <Spacer />
        <Button
          type="submit"
          form="dashboard-form"
          colorScheme="brand"
          isLoading={saving}
          loadingText={isEditMode ? 'Updating...' : 'Creating...'}
        >
          {isEditMode ? 'Save Dashboard' : 'Create Dashboard'}
        </Button>
      </Flex>

      <VStack spacing={8} align="stretch">
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm">
          <Heading size="lg" mb={4}>Dashboard Details</Heading>
          <form id="dashboard-form" onSubmit={handleSubmit}>
            <FormControl isRequired mb={4}>
              <FormLabel>Dashboard Name</FormLabel>
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="e.g., Sales Performance"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="A brief description of this dashboard's purpose."
              />
            </FormControl>
          </form>
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm">
          <Heading size="lg" mb={4}>Select Charts</Heading>
          {availableCharts.length === 0 ? (
            <Flex direction="column" align="center" py={10}>
              <Text fontSize="lg" color="gray.500" mb={4}>No charts available. Create a new chart first!</Text>
              <Button as={RouterLink} to="/charts/new" colorScheme="brand" leftIcon={<AddIcon />}>
                Create New Chart
              </Button>
            </Flex>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
              {availableCharts.map((chart) => (
                <Checkbox
                  key={chart.id}
                  isChecked={selectedChartIds.has(chart.id)}
                  onChange={(e) => handleChartSelectionChange(chart.id, e.target.checked)}
                  colorScheme="brand"
                  size="lg"
                >
                  <Box p={2} borderWidth="1px" borderRadius="md" _hover={{ bg: 'gray.50' }} flex="1">
                    <Text fontWeight="medium">{chart.name}</Text>
                    <Text fontSize="sm" color="gray.500">{chart.type} from {chart.dataSource?.name || 'N/A'}</Text>
                  </Box>
                </Checkbox>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Box p={6} borderWidth={1} borderRadius="lg" bg="white" boxShadow="sm">
          <Heading size="lg" mb={4}>Dashboard Layout</Heading>
          {currentLayout.length === 0 ? (
            <Text fontSize="md" color="gray.500">
              Select charts above to add them to the dashboard layout.
            </Text>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: currentLayout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={30}
              isDraggable={true}
              isResizable={true}
              onLayoutChange={onLayoutChange}
              margin={[15, 15]}
              containerPadding={[15, 15]}
            >
              {chartsToRender.map(chart => (
                <Box key={chart.id} data-grid={layout.find(item => item.i === chart.id)}>
                  <ChartRenderer chartId={chart.id} height="100%" title={chart.name} />
                </Box>
              ))}
            </ResponsiveGridLayout>
          )}
        </Box>
      </VStack>
    </Box>
  );
}

export default DashboardBuilderPage;
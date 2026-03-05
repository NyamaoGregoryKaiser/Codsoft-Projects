import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Flex, Spacer, Button, Spinner, Alert, AlertIcon, Grid, GridItem } from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import ChartRenderer from '../components/ChartRenderer';
import apiClient from '../api/apiClient';
import { EditIcon } from '@chakra-ui/icons';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

function DashboardDetailPage() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/dashboards/${id}`);
        setDashboard(response.data.data.dashboard);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard.');
        console.error('Fetch dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

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

  if (!dashboard) {
    return (
      <Alert status="info">
        <AlertIcon />
        Dashboard not found.
      </Alert>
    );
  }

  return (
    <Box p={4}>
      <Flex mb={6} align="center">
        <Box>
          <Heading as="h1" size="xl" mb={2}>{dashboard.name}</Heading>
          <Text fontSize="md" color="gray.600">{dashboard.description}</Text>
        </Box>
        <Spacer />
        <Button as={RouterLink} to={`/dashboards/${dashboard.id}/edit`} colorScheme="brand" leftIcon={<EditIcon />}>
          Edit Dashboard
        </Button>
      </Flex>

      {dashboard.charts && dashboard.charts.length > 0 ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: dashboard.charts }} // Using dashboard.charts as layout data directly
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          isDraggable={false} // View mode, not draggable
          isResizable={false} // View mode, not resizable
          margin={[20, 20]} // Spacing between charts
          containerPadding={[20, 20]}
        >
          {dashboard.charts.map(chartItem => (
            <GridItem key={chartItem.i} data-grid={chartItem}>
              <ChartRenderer
                chartId={chartItem.i}
                height="100%"
                title={chartItem.chart?.name || 'Chart'}
              />
            </GridItem>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <Text fontSize="lg" color="gray.500" mt={8}>
          This dashboard has no charts yet. You can add them in edit mode.
        </Text>
      )}
    </Box>
  );
}

export default DashboardDetailPage;
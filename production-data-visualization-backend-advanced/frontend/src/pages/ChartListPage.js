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
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ChartRenderer from '../components/ChartRenderer';

function ChartListPage() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/charts');
      setCharts(response.data.data.charts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load charts.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load charts.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleDeleteChart = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chart?')) return;

    try {
      await apiClient.delete(`/charts/${id}`);
      setCharts(charts.filter((c) => c.id !== id));
      toast({
        title: 'Chart Deleted',
        description: 'Chart has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete chart.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete chart.',
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
        <Heading as="h1" size="xl">Your Charts</Heading>
        <Spacer />
        <Button as={RouterLink} to="/charts/new" colorScheme="brand" leftIcon={<AddIcon />}>
          Create New Chart
        </Button>
      </Flex>

      {charts.length === 0 ? (
        <Text fontSize="lg" color="gray.500">
          No charts created yet. Start by creating a new one!
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {charts.map((chart) => (
            <Card key={chart.id} boxShadow="md" borderRadius="lg" overflow="hidden" p={4}>
              <CardHeader pb={2}>
                <Flex align="center">
                  <Box>
                    <Heading size="md">{chart.name}</Heading>
                    <Text fontSize="sm" color="gray.600">Type: {chart.type} | Source: {chart.dataSource?.name || 'N/A'}</Text>
                  </Box>
                  <Spacer />
                  <Stack direction="row" spacing={2}>
                    <IconButton
                      as={RouterLink}
                      to={`/charts/${chart.id}/edit`}
                      icon={<EditIcon />}
                      aria-label="Edit Chart"
                      colorScheme="yellow"
                      size="sm"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      aria-label="Delete Chart"
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteChart(chart.id)}
                    />
                  </Stack>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <ChartRenderer chartId={chart.id} height="250px" title="" />
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default ChartListPage;
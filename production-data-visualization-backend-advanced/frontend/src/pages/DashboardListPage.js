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
import { AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api/apiClient';

function DashboardListPage() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchDashboards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/dashboards');
      setDashboards(response.data.data.dashboards);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboards.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load dashboards.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDeleteDashboard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      await apiClient.delete(`/dashboards/${id}`);
      setDashboards(dashboards.filter((d) => d.id !== id));
      toast({
        title: 'Dashboard Deleted',
        description: 'Dashboard has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete dashboard.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete dashboard.',
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
        <Heading as="h1" size="xl">Your Dashboards</Heading>
        <Spacer />
        <Button as={RouterLink} to="/dashboards/new" colorScheme="brand" leftIcon={<AddIcon />}>
          Create New Dashboard
        </Button>
      </Flex>

      {dashboards.length === 0 ? (
        <Text fontSize="lg" color="gray.500">
          No dashboards created yet. Start by creating a new one!
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} boxShadow="md" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Flex align="center">
                  <Heading size="md">{dashboard.name}</Heading>
                  <Spacer />
                  <Stack direction="row" spacing={2}>
                    <IconButton
                      as={RouterLink}
                      to={`/dashboards/${dashboard.id}`}
                      icon={<ViewIcon />}
                      aria-label="View Dashboard"
                      colorScheme="blue"
                      size="sm"
                    />
                    <IconButton
                      as={RouterLink}
                      to={`/dashboards/${dashboard.id}/edit`}
                      icon={<EditIcon />}
                      aria-label="Edit Dashboard"
                      colorScheme="yellow"
                      size="sm"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      aria-label="Delete Dashboard"
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteDashboard(dashboard.id)}
                    />
                  </Stack>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <Text fontSize="sm" color="gray.600">{dashboard.description || 'No description provided.'}</Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default DashboardListPage;
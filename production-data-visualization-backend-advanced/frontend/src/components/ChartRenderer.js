import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Flex, Text, Spinner, Alert, AlertIcon, AlertDescription, AlertTitle } from '@chakra-ui/react';
import apiClient from '../api/apiClient';

function ChartRenderer({ chartId, height = '300px', width = '100%', title = 'Loading Chart...' }) {
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartId) {
      setError("No chart ID provided.");
      setLoading(false);
      return;
    }

    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/charts/${chartId}/data`);
        const { chartConfig, data } = response.data.data;

        // Dynamic data mapping for Echarts options
        const mappedOptions = { ...chartConfig };

        // Example: Update series data if available in the fetched `data`
        // This is a simplified example. A real-world solution might need a more
        // robust data mapping function based on chart type and config.
        if (mappedOptions.series && Array.isArray(mappedOptions.series) && data) {
          mappedOptions.series = mappedOptions.series.map(seriesItem => {
            // Assume the first series is the primary data
            if (seriesItem.type === 'pie' && Array.isArray(data)) {
              // For pie charts, 'data' is usually an array of {name, value} objects
              // Our seed data already provides this format.
              return { ...seriesItem, data: data };
            } else if ((seriesItem.type === 'bar' || seriesItem.type === 'line') && Array.isArray(data)) {
              // For bar/line, assume the series data needs to be extracted from 'data'
              // based on a key (e.g., 'sales' or 'profit').
              // This requires the chartConfig to specify which field to use.
              const valueKey = seriesItem.name ? seriesItem.name.toLowerCase() : 'value'; // Fallback
              return { ...seriesItem, data: data.map(d => d[valueKey]) };
            }
            return seriesItem;
          });
        }
        // Also update xAxis categories for bar/line charts
        if (mappedOptions.xAxis && mappedOptions.xAxis.type === 'category' && data && data.length > 0) {
          const categoryKey = mappedOptions.xAxis.data ? 'month' : Object.keys(data[0])[0]; // Heuristic, or should be explicit in chartConfig
          mappedOptions.xAxis.data = data.map(d => d[categoryKey]);
        }


        setChartOptions(mappedOptions);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch chart data.');
        console.error("Error fetching chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [chartId]);

  if (loading) {
    return (
      <Flex h={height} w={width} align="center" justify="center" bg="white" borderRadius="md" boxShadow="sm">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box h={height} w={width} bg="white" borderRadius="md" boxShadow="sm" p={4}>
        <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="100%">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Error Loading Chart
          </AlertTitle>
          <AlertDescription maxWidth="sm">{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  if (!chartOptions) {
    return (
      <Flex h={height} w={width} align="center" justify="center" bg="white" borderRadius="md" boxShadow="sm">
        <Text>No chart options available.</Text>
      </Flex>
    );
  }

  return (
    <Box h={height} w={width} bg="white" borderRadius="md" boxShadow="sm" p={4} position="relative">
      <Text fontSize="lg" fontWeight="bold" mb={2}>{title}</Text>
      <ReactECharts
        option={chartOptions}
        style={{ height: 'calc(100% - 40px)', width: '100%' }} // Adjust height to account for title
        ref={chartRef}
        notMerge={true}
        lazyUpdate={true}
        theme={"light"}
      />
    </Box>
  );
}

export default ChartRenderer;
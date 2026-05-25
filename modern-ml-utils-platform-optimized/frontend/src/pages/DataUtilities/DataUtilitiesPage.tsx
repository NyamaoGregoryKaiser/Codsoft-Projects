import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  Select,
  VStack,
  HStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Code,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
} from '@chakra-ui/react';
import { oneHotEncodeData, minMaxScaleData } from '@api/dataUtilities';

interface DataUtilityFormState {
  utilityType: 'one-hot' | 'min-max';
  inputData: string; // JSON string
  columnName: string;
}

const DataUtilitiesPage = () => {
  const [form, setForm] = useState<DataUtilityFormState>({
    utilityType: 'one-hot',
    inputData: '[\n  { "category": "A", "value": 10 },\n  { "category": "B", "value": 20 },\n  { "category": "A", "value": 15 }\n]',
    columnName: 'category',
  });
  const [outputData, setOutputData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Reset column name hint based on utility type
    if (name === 'utilityType') {
      if (value === 'one-hot') {
        setForm((prev) => ({ ...prev, columnName: 'category', inputData: '[\n  { "category": "A", "value": 10 },\n  { "category": "B", "value": 20 },\n  { "category": "A", "value": 15 }\n]' }));
      } else if (value === 'min-max') {
        setForm((prev) => ({ ...prev, columnName: 'value', inputData: '[\n  { "item": "X", "value": 5 },\n  { "item": "Y", "value": 15 },\n  { "item": "Z", "value": 10 }\n]' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOutputData(null);

    try {
      const parsedData = JSON.parse(form.inputData);
      if (!Array.isArray(parsedData)) {
        throw new Error('Input data must be a JSON array.');
      }

      let result;
      if (form.utilityType === 'one-hot') {
        result = await oneHotEncodeData(parsedData, form.columnName);
      } else if (form.utilityType === 'min-max') {
        result = await minMaxScaleData(parsedData, form.columnName);
      } else {
        throw new Error('Invalid utility type selected.');
      }
      setOutputData(result.encodedData || result.scaledData);
      toast({
        title: 'Operation successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unknown error occurred.');
      toast({
        title: 'Operation failed.',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <Heading as="h1" size="xl" mb={4}>
        Data Utilities
      </Heading>
      <Text fontSize="lg" color="gray.600" mb={8}>
        Apply common data preprocessing and feature engineering techniques.
      </Text>

      <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Select Utility</FormLabel>
              <Select
                name="utilityType"
                value={form.utilityType}
                onChange={handleInputChange}
              >
                <option value="one-hot">One-Hot Encoding</option>
                <option value="min-max">Min-Max Scaling</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Input Data (JSON Array)</FormLabel>
              <Textarea
                name="inputData"
                value={form.inputData}
                onChange={handleInputChange}
                placeholder='e.g., [{"color": "red", "value": 1}, {"color": "blue", "value": 2}]'
                rows={10}
                fontFamily="monospace"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Column Name to Process</FormLabel>
              <Input
                name="columnName"
                value={form.columnName}
                onChange={handleInputChange}
                placeholder={form.utilityType === 'one-hot' ? 'e.g., category' : 'e.g., value'}
              />
            </FormControl>

            <Button type="submit" colorScheme="blue" isLoading={loading} alignSelf="flex-start">
              Apply Utility
            </Button>
          </VStack>
        </form>
      </Box>

      {error && (
        <Alert status="error" mt={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {outputData && (
        <Box mt={8} bg="gray.700" color="white" p={6} borderRadius="lg" boxShadow="md">
          <Heading size="md" mb={4}>
            Output Data
          </Heading>
          <Code whiteSpace="pre" borderRadius="md" p={4} display="block" overflowX="auto">
            {JSON.stringify(outputData, null, 2)}
          </Code>
        </Box>
      )}
    </Box>
  );
};

export default DataUtilitiesPage;
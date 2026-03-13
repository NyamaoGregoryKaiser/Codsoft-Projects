```typescript
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Spinner,
  Flex,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Code,
  Button,
  Textarea,
  Input,
  VStack,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import api from 'api/axios';
import { QueryMetrics, IndexMetrics, TableSchema, ApiResponse, TableColumn } from 'types';
import { MdRefresh } from 'react-icons/md';

// Helper to format duration
const formatDuration = (ms: number | undefined) => {
  if (ms === undefined) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const MonitorPage: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const toast = useToast();

  const [connectionName, setConnectionName] = useState<string>('');
  const [activeQueries, setActiveQueries] = useState<QueryMetrics[]>([]);
  const [slowQueries, setSlowQueries] = useState<QueryMetrics[]>([]);
  const [indexes, setIndexes] = useState<IndexMetrics[]>([]);
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([]);

  const [loadingActiveQueries, setLoadingActiveQueries] = useState(false);
  const [loadingSlowQueries, setLoadingSlowQueries] = useState(false);
  const [loadingIndexes, setLoadingIndexes] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingAnalyzeQuery, setLoadingAnalyzeQuery] = useState(false);
  const [loadingCreateIndex, setLoadingCreateIndex] = useState(false);
  const [loadingDropIndex, setLoadingDropIndex] = useState(false);

  const [queryToAnalyze, setQueryToAnalyze] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState('');

  const [createIndexTableName, setCreateIndexTableName] = useState('');
  const [createIndexColumns, setCreateIndexColumns] = useState<string[]>([]);
  const [createIndexName, setCreateIndexName] = useState('');
  const [createIndexUnique, setCreateIndexUnique] = useState(false);

  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const [indexToDrop, setIndexToDrop] = useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);


  const fetchConnectionDetails = useCallback(async () => {
    if (!connectionId) return;
    try {
      const response = await api.get<ApiResponse<any>>(`/connections/${connectionId}`);
      if (response.data.success && response.data.data) {
        setConnectionName(response.data.data.name);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch connection details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [connectionId, toast]);

  const fetchActiveQueries = useCallback(async () => {
    if (!connectionId) return;
    setLoadingActiveQueries(true);
    try {
      const response = await api.get<ApiResponse<QueryMetrics[]>>(`/monitor/${connectionId}/active-queries`);
      if (response.data.success && response.data.data) {
        setActiveQueries(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch active queries.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingActiveQueries(false);
    }
  }, [connectionId, toast]);

  const fetchSlowQueries = useCallback(async () => {
    if (!connectionId) return;
    setLoadingSlowQueries(true);
    try {
      const response = await api.get<ApiResponse<QueryMetrics[]>>(`/monitor/${connectionId}/slow-queries?thresholdMs=500`); // Example: queries > 500ms
      if (response.data.success && response.data.data) {
        setSlowQueries(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch slow queries.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingSlowQueries(false);
    }
  }, [connectionId, toast]);

  const handleAnalyzeQuery = async () => {
    if (!connectionId || !queryToAnalyze.trim()) {
      toast({ title: 'Error', description: 'Query cannot be empty.', status: 'error' });
      return;
    }
    setLoadingAnalyzeQuery(true);
    try {
      const response = await api.post<ApiResponse<string>>(`/monitor/${connectionId}/analyze-query`, { query: queryToAnalyze });
      if (response.data.success && response.data.data) {
        setAnalyzeResult(response.data.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to analyze query.';
      const errors = error.response?.data?.errors?.join(', ');
      toast({
        title: 'Error',
        description: errors || errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setAnalyzeResult(`Error: ${errors || errorMessage}`);
    } finally {
      setLoadingAnalyzeQuery(false);
    }
  };

  const fetchIndexes = useCallback(async () => {
    if (!connectionId) return;
    setLoadingIndexes(true);
    try {
      const response = await api.get<ApiResponse<IndexMetrics[]>>(`/monitor/${connectionId}/indexes`);
      if (response.data.success && response.data.data) {
        setIndexes(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch indexes.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingIndexes(false);
    }
  }, [connectionId, toast]);

  const handleCreateIndex = async () => {
    if (!connectionId || !createIndexTableName || createIndexColumns.length === 0) {
      toast({ title: 'Error', description: 'Table name and at least one column are required.', status: 'error' });
      return;
    }
    setLoadingCreateIndex(true);
    try {
      const response = await api.post<ApiResponse<string>>(`/monitor/${connectionId}/indexes`, {
        tableName: createIndexTableName,
        columns: createIndexColumns,
        indexName: createIndexName,
        unique: createIndexUnique,
      });
      if (response.data.success) {
        toast({ title: 'Success', description: response.data.message, status: 'success' });
        fetchIndexes(); // Refresh indexes list
        // Reset form
        setCreateIndexTableName('');
        setCreateIndexColumns([]);
        setCreateIndexName('');
        setCreateIndexUnique(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create index.';
      const errors = error.response?.data?.errors?.join(', ');
      toast({
        title: 'Error',
        description: errors || errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingCreateIndex(false);
    }
  };

  const openDropIndexAlert = (indexrelname: string) => {
    setIndexToDrop(indexrelname);
    onAlertOpen();
  };

  const confirmDropIndex = async () => {
    if (!connectionId || !indexToDrop) return;
    setLoadingDropIndex(true);
    try {
      const response = await api.delete<ApiResponse<string>>(`/monitor/${connectionId}/indexes`, { data: { indexName: indexToDrop } });
      if (response.data.success) {
        toast({ title: 'Success', description: response.data.message, status: 'success' });
        fetchIndexes(); // Refresh indexes list
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to drop index.';
      const errors = error.response?.data?.errors?.join(', ');
      toast({
        title: 'Error',
        description: errors || errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingDropIndex(false);
      onAlertClose();
      setIndexToDrop(null);
    }
  };


  const fetchTableSchemas = useCallback(async () => {
    if (!connectionId) return;
    setLoadingSchemas(true);
    try {
      const response = await api.get<ApiResponse<TableSchema[]>>(`/monitor/${connectionId}/schema`);
      if (response.data.success && response.data.data) {
        setTableSchemas(response.data.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch table schemas.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingSchemas(false);
    }
  }, [connectionId, toast]);

  useEffect(() => {
    fetchConnectionDetails();
    // Initial fetch for all tabs
    fetchActiveQueries();
    fetchSlowQueries();
    fetchIndexes();
    fetchTableSchemas();

    // Set up polling for active queries
    const activeQueryInterval = setInterval(fetchActiveQueries, 5000); // Poll every 5 seconds
    const slowQueryInterval = setInterval(fetchSlowQueries, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(activeQueryInterval);
      clearInterval(slowQueryInterval);
    };
  }, [fetchConnectionDetails, fetchActiveQueries, fetchSlowQueries, fetchIndexes, fetchTableSchemas]);

  const handleColumnsChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setCreateIndexColumns(options);
  };

  const getTableColumns = (tableName: string): TableColumn[] => {
    const table = tableSchemas.find(s => s.tableName === tableName);
    return table ? table.columns : [];
  };

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h2" size="xl">
          Monitoring: {connectionName || connectionId}
        </Heading>
      </Flex>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Active Queries</Tab>
          <Tab>Slow Queries</Tab>
          <Tab>Query Analyzer</Tab>
          <Tab>Indexes</Tab>
          <Tab>Schema</Tab>
        </TabList>

        <TabPanels>
          {/* Active Queries Tab */}
          <TabPanel>
            <Flex justifyContent="flex-end" mb={4}>
              <Button onClick={fetchActiveQueries} isLoading={loadingActiveQueries} leftIcon={<MdRefresh />}>
                Refresh
              </Button>
            </Flex>
            {loadingActiveQueries ? (
              <Flex justify="center" p={4}><Spinner /></Flex>
            ) : activeQueries.length === 0 ? (
              <Text>No active queries found.</Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>PID</Th>
                    <Th>User</Th>
                    <Th>DB</Th>
                    <Th>Client</Th>
                    <Th>State</Th>
                    <Th>Duration</Th>
                    <Th>Query</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {activeQueries.map((q) => (
                    <Tr key={q.pid}>
                      <Td>{q.pid}</Td>
                      <Td>{q.usename}</Td>
                      <Td>{q.datname}</Td>
                      <Td>{q.client_addr}</Td>
                      <Td><Badge colorScheme={q.state === 'active' ? 'green' : 'gray'}>{q.state}</Badge></Td>
                      <Td>{formatDuration(q.duration_ms)}</Td>
                      <Td><Code maxW="300px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{q.query}</Code></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TabPanel>

          {/* Slow Queries Tab */}
          <TabPanel>
            <Flex justifyContent="flex-end" mb={4}>
              <Button onClick={fetchSlowQueries} isLoading={loadingSlowQueries} leftIcon={<MdRefresh />}>
                Refresh
              </Button>
            </Flex>
            {loadingSlowQueries ? (
              <Flex justify="center" p={4}><Spinner /></Flex>
            ) : slowQueries.length === 0 ? (
              <Text>No slow queries (longer than 500ms) found.</Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>PID</Th>
                    <Th>User</Th>
                    <Th>DB</Th>
                    <Th>Client</Th>
                    <Th>State</Th>
                    <Th>Duration</Th>
                    <Th>Query</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {slowQueries.map((q) => (
                    <Tr key={q.pid}>
                      <Td>{q.pid}</Td>
                      <Td>{q.usename}</Td>
                      <Td>{q.datname}</Td>
                      <Td>{q.client_addr}</Td>
                      <Td><Badge colorScheme={q.state === 'active' ? 'orange' : 'red'}>{q.state}</Badge></Td>
                      <Td>{formatDuration(q.duration_ms)}</Td>
                      <Td><Code maxW="300px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{q.query}</Code></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TabPanel>

          {/* Query Analyzer Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>SQL Query (SELECT only for EXPLAIN ANALYZE)</FormLabel>
                <Textarea
                  value={queryToAnalyze}
                  onChange={(e) => setQueryToAnalyze(e.target.value)}
                  placeholder="e.g., SELECT * FROM users WHERE id = 'some-uuid';"
                  rows={8}
                  fontFamily="mono"
                />
              </FormControl>
              <Button onClick={handleAnalyzeQuery} isLoading={loadingAnalyzeQuery} colorScheme="blue">
                Run EXPLAIN ANALYZE
              </Button>
              {analyzeResult && (
                <Box>
                  <Heading size="md" mt={4} mb={2}>Execution Plan</Heading>
                  <Code p={4} w="full" whiteSpace="pre-wrap" display="block" bg="gray.700" color="white" borderRadius="md">
                    {analyzeResult}
                  </Code>
                </Box>
              )}
            </VStack>
          </TabPanel>

          {/* Indexes Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box>
                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                  <Heading size="md">Existing Indexes</Heading>
                  <Button onClick={fetchIndexes} isLoading={loadingIndexes} leftIcon={<MdRefresh />}>
                    Refresh
                  </Button>
                </Flex>
                {loadingIndexes ? (
                  <Flex justify="center" p={4}><Spinner /></Flex>
                ) : indexes.length === 0 ? (
                  <Text>No indexes found for this connection.</Text>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Schema</Th>
                        <Th>Table</Th>
                        <Th>Index Name</Th>
                        <Th>Scans</Th>
                        <Th>Tuples Read</Th>
                        <Th>Tuples Fetched</Th>
                        <Th>Definition</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {indexes.map((idx) => (
                        <Tr key={idx.indexrelname}>
                          <Td>{idx.schemaname}</Td>
                          <Td>{idx.relname}</Td>
                          <Td fontWeight="bold">{idx.indexrelname}</Td>
                          <Td>{idx.idx_scan}</Td>
                          <Td>{idx.idx_tup_read}</Td>
                          <Td>{idx.idx_tup_fetch}</Td>
                          <Td><Code maxW="250px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{idx.indexdef}</Code></Td>
                          <Td>
                            <Button size="xs" colorScheme="red" onClick={() => openDropIndexAlert(idx.indexrelname)} isLoading={loadingDropIndex}>
                              Drop
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>

              <Box>
                <Heading size="md" mb={4}>Create New Index</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Table Name</FormLabel>
                    <Select
                      placeholder="Select table"
                      value={createIndexTableName}
                      onChange={(e) => {
                        setCreateIndexTableName(e.target.value);
                        setCreateIndexColumns([]); // Reset columns when table changes
                      }}
                    >
                      {tableSchemas.map(schema => (
                        <option key={schema.tableName} value={schema.tableName}>{schema.tableName}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Columns (Select multiple)</FormLabel>
                    <Select
                      placeholder="Select columns"
                      multiple
                      value={createIndexColumns}
                      onChange={handleColumnsChange}
                      isDisabled={!createIndexTableName}
                    >
                      {getTableColumns(createIndexTableName).map(col => (
                        <option key={col.columnName} value={col.columnName}>{col.columnName}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Index Name (Optional)</FormLabel>
                    <Input value={createIndexName} onChange={(e) => setCreateIndexName(e.target.value)} />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Unique Index?</FormLabel>
                    <Input
                      type="checkbox"
                      isChecked={createIndexUnique}
                      onChange={(e) => setCreateIndexUnique(e.target.checked)}
                      w="unset"
                      mr={2}
                    />
                    <Text fontSize="sm" color="gray.500">
                      Creates an index where all values in the indexed columns must be unique.
                    </Text>
                  </FormControl>
                  <Button onClick={handleCreateIndex} isLoading={loadingCreateIndex} colorScheme="green">
                    Create Index
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>

          {/* Schema Tab */}
          <TabPanel>
            <Flex justifyContent="flex-end" mb={4}>
              <Button onClick={fetchTableSchemas} isLoading={loadingSchemas} leftIcon={<MdRefresh />}>
                Refresh
              </Button>
            </Flex>
            {loadingSchemas ? (
              <Flex justify="center" p={4}><Spinner /></Flex>
            ) : tableSchemas.length === 0 ? (
              <Text>No schema information found.</Text>
            ) : (
              <VStack align="stretch" spacing={8}>
                {tableSchemas.map((table) => (
                  <Box key={table.tableName} borderWidth="1px" borderRadius="lg" p={4}>
                    <Heading size="md" mb={4}>{table.tableName}</Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Column Name</Th>
                          <Th>Data Type</Th>
                          <Th>Nullable</Th>
                          <Th>Default Value</Th>
                          <Th>Primary Key</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {table.columns.map((col) => (
                          <Tr key={col.columnName}>
                            <Td fontWeight={col.isPrimary ? 'bold' : 'normal'}>{col.columnName}</Td>
                            <Td>{col.dataType}</Td>
                            <Td>{col.isNullable ? 'Yes' : 'No'}</Td>
                            <Td>{col.defaultValue || 'N/A'}</Td>
                            <Td>{col.isPrimary ? 'Yes' : 'No'}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Drop Index
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to drop index "{indexToDrop}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDropIndex} ml={3} isLoading={loadingDropIndex}>
                Drop Index
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default MonitorPage;
```
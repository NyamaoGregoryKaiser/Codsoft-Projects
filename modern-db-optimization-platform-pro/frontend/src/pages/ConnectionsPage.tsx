```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Stack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import api from 'api/axios';
import { DbConnection, ApiResponse } from 'types';
import ConnectionForm from 'components/ConnectionForm';
import { Link as RouterLink } from 'react-router-dom';
import { EditIcon, DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';

const ConnectionsPage: React.FC = () => {
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<DbConnection | undefined>(undefined);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();

  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<DbConnection[]>>('/connections');
      if (response.data.success && response.data.data) {
        setConnections(response.data.data);
      } else {
        toast({
          title: 'Error loading connections',
          description: response.data.message || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch connections.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAddConnection = () => {
    setSelectedConnection(undefined);
    onFormOpen();
  };

  const handleEditConnection = (connection: DbConnection) => {
    setSelectedConnection(connection);
    onFormOpen();
  };

  const handleDeleteConnection = (connectionId: string) => {
    setConnectionToDelete(connectionId);
    onAlertOpen();
  };

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return;
    try {
      await api.delete(`/connections/${connectionToDelete}`);
      toast({
        title: 'Connection deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchConnections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete connection.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setConnectionToDelete(null);
      onAlertClose();
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="calc(100vh - 64px)">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h2" size="xl">
          Your Database Connections
        </Heading>
        <Button colorScheme="blue" onClick={handleAddConnection}>
          Add New Connection
        </Button>
      </Flex>

      {connections.length === 0 ? (
        <Text fontSize="lg" mt={4}>
          No database connections found. Click "Add New Connection" to get started.
        </Text>
      ) : (
        <Table variant="simple" size="lg">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Host</Th>
              <Th>Port</Th>
              <Th>Database</Th>
              <Th>User</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {connections.map((conn) => (
              <Tr key={conn.id}>
                <Td fontWeight="bold">{conn.name}</Td>
                <Td>{conn.host}</Td>
                <Td>{conn.port}</Td>
                <Td>{conn.dbName}</Td>
                <Td>{conn.dbUser}</Td>
                <Td>
                  <Stack direction="row" spacing={2}>
                    <Button
                      size="sm"
                      as={RouterLink}
                      to={`/connections/${conn.id}/monitor`}
                      leftIcon={<ExternalLinkIcon />}
                    >
                      Monitor
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditConnection(conn)}
                      leftIcon={<EditIcon />}
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteConnection(conn.id)}
                      leftIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <ConnectionForm
        isOpen={isFormOpen}
        onClose={onFormClose}
        onSuccess={fetchConnections}
        connectionToEdit={selectedConnection}
      />

      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Connection
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You can't undo this action.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteConnection} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ConnectionsPage;
```
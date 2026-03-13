```typescript
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
import api from 'api/axios';
import { DbConnection } from 'types';

interface ConnectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  connectionToEdit?: DbConnection;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ isOpen, onClose, onSuccess, connectionToEdit }) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (connectionToEdit) {
      setName(connectionToEdit.name);
      setHost(connectionToEdit.host);
      setPort(connectionToEdit.port);
      setDbName(connectionToEdit.dbName);
      setDbUser(connectionToEdit.dbUser);
      setDbPassword(''); // Password is never pre-filled for security
    } else {
      resetForm();
    }
  }, [connectionToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setHost('');
    setPort(5432);
    setDbName('');
    setDbUser('');
    setDbPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = { name, host, port, dbName, dbUser, dbPassword };
      if (connectionToEdit) {
        // Only include password if it's explicitly set by the user
        const updateData: any = { name, host, port, dbName, dbUser };
        if (dbPassword) {
          updateData.dbPassword = dbPassword;
        }
        await api.put(`/connections/${connectionToEdit.id}`, updateData);
        toast({
          title: 'Connection updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/connections', data);
        toast({
          title: 'Connection created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      const errors = error.response?.data?.errors?.join(', ');
      toast({
        title: 'Error',
        description: errors || errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{connectionToEdit ? 'Edit Connection' : 'Add New Connection'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Connection Name</FormLabel>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Host</FormLabel>
                <Input value={host} onChange={(e) => setHost(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Port</FormLabel>
                <Input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Database Name</FormLabel>
                <Input value={dbName} onChange={(e) => setDbName(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Database User</FormLabel>
                <Input value={dbUser} onChange={(e) => setDbUser(e.target.value)} />
              </FormControl>
              <FormControl isRequired={!connectionToEdit}>
                <FormLabel>Database Password</FormLabel>
                <Input
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder={connectionToEdit ? 'Leave blank to keep current password' : ''}
                />
              </FormControl>
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" isLoading={isLoading} onClick={handleSubmit}>
            {connectionToEdit ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConnectionForm;
```
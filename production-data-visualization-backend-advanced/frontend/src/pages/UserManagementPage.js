import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Spacer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import apiClient from '../api/apiClient';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // For editing
  const [modalUsername, setModalUsername] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalRole, setModalRole] = useState('user');
  const [modalPassword, setModalPassword] = useState(''); // Only for new user or password change

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load users.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setCurrentUser(null);
    setModalUsername('');
    setModalEmail('');
    setModalRole('user');
    setModalPassword('');
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setModalUsername(user.username);
    setModalEmail(user.email);
    setModalRole(user.role);
    setModalPassword(''); // Never pre-fill password for security
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    setError(null);
    try {
      const userData = {
        username: modalUsername,
        email: modalEmail,
        role: modalRole,
      };

      if (currentUser) {
        // Update existing user
        await apiClient.put(`/users/${currentUser.id}`, userData);
        toast({ title: 'User Updated', status: 'success' });
      } else {
        // Create new user (password is required)
        if (!modalPassword) {
          setError('Password is required for new users.');
          setSaving(false);
          return;
        }
        await apiClient.post('/auth/register', { ...userData, password: modalPassword });
        toast({ title: 'User Created', status: 'success' });
      }
      fetchUsers(); // Refresh the list
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user.');
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save user.', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/users/${id}`);
      setUsers(users.filter(user => user.id !== id));
      toast({ title: 'User Deleted', status: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete user.', status: 'error' });
    }
  };

  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (error && !isModalOpen) { // Only show global error if modal isn't open
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
        <Heading as="h1" size="xl">User Management</Heading>
        <Spacer />
        <Button colorScheme="brand" leftIcon={<AddIcon />} onClick={handleCreateUser}>
          Add New User
        </Button>
      </Flex>

      {users.length === 0 ? (
        <Text fontSize="lg" color="gray.500">
          No users found.
        </Text>
      ) : (
        <Table variant="simple" boxShadow="md" borderRadius="lg" bg="white">
          <Thead>
            <Tr>
              <Th>Username</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{user.username}</Td>
                <Td>{user.email}</Td>
                <Td>{user.role}</Td>
                <Td>
                  <IconButton
                    icon={<EditIcon />}
                    aria-label="Edit User"
                    size="sm"
                    mr={2}
                    onClick={() => handleEditUser(user)}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    aria-label="Delete User"
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteUser(user.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{currentUser ? 'Edit User' : 'Create New User'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            <FormControl mb={3} isRequired>
              <FormLabel>Username</FormLabel>
              <Input value={modalUsername} onChange={(e) => setModalUsername(e.target.value)} />
            </FormControl>
            <FormControl mb={3} isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} />
            </FormControl>
            <FormControl mb={3} isRequired>
              <FormLabel>Role</FormLabel>
              <Select value={modalRole} onChange={(e) => setModalRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </FormControl>
            {!currentUser && ( // Password only for new users
              <FormControl mb={3} isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={modalPassword} onChange={(e) => setModalPassword(e.target.value)} />
              </FormControl>
            )}
            {/* If allowing password change for existing users, would need a separate field and validation */}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleSaveUser} isLoading={saving}>
              {currentUser ? 'Save Changes' : 'Create User'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default UserManagementPage;
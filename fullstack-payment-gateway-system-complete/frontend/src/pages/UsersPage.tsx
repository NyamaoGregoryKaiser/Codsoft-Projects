import React, { useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  HStack,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types/auth'; // Re-use types
import { useForm } from 'react-hook-form';
import { getMerchants } from '@/api/merchants';

const UsersPage = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const is_admin = hasRole([UserRole.ADMIN]);
  const is_merchant_user = hasRole([UserRole.MERCHANT_USER]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Partial<User> & { password?: string }>();

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['users', user?.merchantId],
    queryFn: () => getUsers(is_merchant_user ? user?.merchantId : undefined),
  });

  const {
    data: merchants,
    isLoading: isLoadingMerchants,
    isError: isErrorMerchants,
    error: errorMerchants,
  } = useQuery({
    queryKey: ['merchants'],
    queryFn: getMerchants,
    enabled: is_admin, // Only fetch merchants if admin
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast({ title: 'User created.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error creating user.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> & { password?: string } }) => updateUser(id, data),
    onSuccess: () => {
      toast({ title: 'User updated.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error updating user.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({ title: 'User deleted.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error deleting user.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    reset({ email: '', password: '', role: is_merchant_user ? UserRole.MERCHANT_USER : UserRole.MERCHANT_USER, merchantId: is_merchant_user ? user?.merchantId : '' });
    setIsModalOpen(true);
  };

  const openEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    reset({
      email: userToEdit.email,
      role: userToEdit.role,
      merchantId: userToEdit.merchantId,
      password: '', // Never pre-fill password for security
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: Partial<User> & { password?: string }) => {
    const submitData = { ...data };
    if (!submitData.password) {
      delete submitData.password; // Don't send empty password field
    }
    if (is_merchant_user) {
        submitData.role = UserRole.MERCHANT_USER; // Merchant users can only create/update merchant_user role
        submitData.merchantId = user?.merchantId; // Merchant users can only manage their own merchant's users
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      createUserMutation.mutate(submitData as User);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  if (isLoading || (is_admin && isLoadingMerchants)) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading users: {error?.message}
      </Alert>
    );
  }

  if (is_admin && isErrorMerchants) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading merchants for admin view: {errorMerchants?.message}
      </Alert>
    );
  }

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">Users</Heading>
        {hasRole([UserRole.ADMIN, UserRole.MERCHANT_USER]) && ( // Both can create users
          <Button colorScheme="blue" onClick={openCreateModal}>
            Create User
          </Button>
        )}
      </Flex>

      {users && users.length === 0 ? (
        <Alert status="info">
            <AlertIcon />
            No users found for this {is_merchant_user ? 'merchant' : 'system'}.
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Merchant</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users?.map((userItem) => (
                <Tr key={userItem.id}>
                  <Td>{userItem.id.substring(0, 8)}...</Td>
                  <Td>{userItem.email}</Td>
                  <Td>{userItem.role}</Td>
                  <Td>{userItem.merchantId || 'N/A'}</Td>
                  <Td>
                    <HStack spacing={2}>
                        <Button size="xs" colorScheme="teal" onClick={() => openEditModal(userItem)}>
                            Edit
                        </Button>
                        <Button
                            size="xs"
                            colorScheme="red"
                            onClick={() => handleDelete(userItem.id)}
                            isDisabled={deleteUserMutation.isPending}
                        >
                            Delete
                        </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingUser ? 'Edit User' : 'Create New User'}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody pb={6}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  {...register('email', { required: 'Email is required' })}
                  placeholder="Email"
                  type="email"
                  isDisabled={!!editingUser} // Email usually not editable
                />
                <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
              </FormControl>

              <FormControl mt={4} isInvalid={!!errors.password}>
                <FormLabel>Password {editingUser && '(Leave blank to keep current)'}</FormLabel>
                <Input
                  {...register('password', { minLength: { value: 6, message: 'Min length 6' } })}
                  placeholder="Password"
                  type="password"
                />
                <FormErrorMessage>{errors.password && errors.password.message}</FormErrorMessage>
              </FormControl>

              <FormControl mt={4} isInvalid={!!errors.role}>
                <FormLabel>Role</FormLabel>
                <Select
                  {...register('role', { required: 'Role is required' })}
                  isDisabled={is_merchant_user} // Merchant users cannot change role
                >
                  <option value={UserRole.MERCHANT_USER}>Merchant User</option>
                  {is_admin && <option value={UserRole.ADMIN}>Admin</option>}
                </Select>
                <FormErrorMessage>{errors.role && errors.role.message}</FormErrorMessage>
              </FormControl>

              {is_admin && ( // Only admin can select merchant
                <FormControl mt={4} isInvalid={!!errors.merchantId}>
                  <FormLabel>Merchant</FormLabel>
                  <Select
                    {...register('merchantId', { required: 'Merchant is required for merchant users' })}
                    placeholder="Select merchant"
                  >
                    {merchants?.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.name}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.merchantId && errors.merchantId.message}</FormErrorMessage>
                </FormControl>
              )}
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit" isLoading={createUserMutation.isPending || updateUserMutation.isPending}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UsersPage;
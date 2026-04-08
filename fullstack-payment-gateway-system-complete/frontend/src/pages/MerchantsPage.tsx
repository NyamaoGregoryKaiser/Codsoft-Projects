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
  FormErrorMessage,
  Switch,
  HStack,
  Text,
  useClipboard,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchants, createMerchant, updateMerchant, deleteMerchant, regenerateMerchantApiKeys } from '@/api/merchants';
import { Merchant, CreateMerchantDto, UpdateMerchantDto } from '@/types/merchant';
import { useForm } from 'react-hook-form';

const MerchantsPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [currentApiKeys, setCurrentApiKeys] = useState<{ apiKey: string; apiSecret: string } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateMerchantDto | UpdateMerchantDto>();
  const { onCopy: onCopyApiKey, hasCopied: hasCopiedApiKey } = useClipboard(currentApiKeys?.apiKey || '');
  const { onCopy: onCopyApiSecret, hasCopied: hasCopiedApiSecret } = useClipboard(currentApiKeys?.apiSecret || '');

  const {
    data: merchants,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['merchants'],
    queryFn: getMerchants,
  });

  const createMerchantMutation = useMutation({
    mutationFn: createMerchant,
    onSuccess: (newMerchant) => {
      toast({ title: 'Merchant created.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      setIsModalOpen(false);
      // Show API keys immediately after creation
      setCurrentApiKeys({ apiKey: newMerchant.apiKey || '', apiSecret: newMerchant.apiSecret || '' });
      setApiKeysModalOpen(true);
    },
    onError: (err: any) => {
      toast({ title: 'Error creating merchant.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const updateMerchantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMerchantDto }) => updateMerchant(id, data),
    onSuccess: () => {
      toast({ title: 'Merchant updated.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error updating merchant.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const deleteMerchantMutation = useMutation({
    mutationFn: deleteMerchant,
    onSuccess: () => {
      toast({ title: 'Merchant deleted.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error deleting merchant.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const regenerateApiKeysMutation = useMutation({
    mutationFn: regenerateMerchantApiKeys,
    onSuccess: (newKeys) => {
      toast({ title: 'API Keys regenerated.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      setCurrentApiKeys(newKeys);
      setApiKeysModalOpen(true);
    },
    onError: (err: any) => {
      toast({ title: 'Error regenerating API keys.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const openCreateModal = () => {
    setEditingMerchant(null);
    reset({ name: '', contactEmail: '', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (merchantToEdit: Merchant) => {
    setEditingMerchant(merchantToEdit);
    reset({
      name: merchantToEdit.name,
      contactEmail: merchantToEdit.contactEmail,
      isActive: merchantToEdit.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: CreateMerchantDto | UpdateMerchantDto) => {
    if (editingMerchant) {
      updateMerchantMutation.mutate({ id: editingMerchant.id, data });
    } else {
      createMerchantMutation.mutate(data as CreateMerchantDto);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this merchant? This action cannot be undone.')) {
      deleteMerchantMutation.mutate(id);
    }
  };

  const handleRegenerateApiKeys = (id: string) => {
    if (confirm('Are you sure you want to regenerate API keys for this merchant? Existing keys will be invalidated.')) {
      regenerateApiKeysMutation.mutate(id);
    }
  };

  if (isLoading) {
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
        Error loading merchants: {error?.message}
      </Alert>
    );
  }

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">Merchants</Heading>
        <Button colorScheme="blue" onClick={openCreateModal}>
          Create Merchant
        </Button>
      </Flex>

      {merchants && merchants.length === 0 ? (
        <Alert status="info">
            <AlertIcon />
            No merchants found.
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Contact Email</Th>
                <Th>Status</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {merchants?.map((merchant) => (
                <Tr key={merchant.id}>
                  <Td>{merchant.id.substring(0, 8)}...</Td>
                  <Td>{merchant.name}</Td>
                  <Td>{merchant.contactEmail || 'N/A'}</Td>
                  <Td>
                    <Switch
                      isChecked={merchant.isActive}
                      onChange={(e) => updateMerchantMutation.mutate({ id: merchant.id, data: { isActive: e.target.checked } })}
                    />
                    <Text as="span" ml={2}>{merchant.isActive ? 'Active' : 'Inactive'}</Text>
                  </Td>
                  <Td>{new Date(merchant.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button size="xs" colorScheme="teal" onClick={() => openEditModal(merchant)}>
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="yellow"
                        onClick={() => handleRegenerateApiKeys(merchant.id)}
                        isLoading={regenerateApiKeysMutation.isPending}
                      >
                        Regenerate API Keys
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        onClick={() => handleDelete(merchant.id)}
                        isLoading={deleteMerchantMutation.isPending}
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

      {/* Create/Edit Merchant Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingMerchant ? 'Edit Merchant' : 'Create New Merchant'}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody pb={6}>
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Merchant Name</FormLabel>
                <Input
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Merchant Name"
                  isDisabled={!!editingMerchant} // Name usually not editable once set
                />
                <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
              </FormControl>

              <FormControl mt={4} isInvalid={!!errors.contactEmail}>
                <FormLabel>Contact Email</FormLabel>
                <Input
                  {...register('contactEmail', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                  placeholder="contact@merchant.com"
                  type="email"
                />
                <FormErrorMessage>{errors.contactEmail && errors.contactEmail.message}</FormErrorMessage>
              </FormControl>

              <FormControl display="flex" alignItems="center" mt={4}>
                <FormLabel htmlFor="isActive" mb="0">
                  Is Active?
                </FormLabel>
                <Switch
                  id="isActive"
                  {...register('isActive')}
                  isChecked={watch('isActive')} // Use watch to keep switch state synced with form
                  onChange={(e) => setValue('isActive', e.target.checked)}
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit" isLoading={createMerchantMutation.isPending || updateMerchantMutation.isPending}>
                {editingMerchant ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* API Keys Display Modal */}
      <Modal isOpen={apiKeysModalOpen} onClose={() => setApiKeysModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Merchant API Keys</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>Please copy these keys. They will not be shown again.</Text>
            <FormControl>
              <FormLabel>API Key (Public)</FormLabel>
              <Input value={currentApiKeys?.apiKey || ''} isReadOnly />
              <Button onClick={onCopyApiKey} size="sm" mt={2}>
                {hasCopiedApiKey ? 'Copied!' : 'Copy API Key'}
              </Button>
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>API Secret (Private)</FormLabel>
              <Input value={currentApiKeys?.apiSecret || ''} isReadOnly />
              <Button onClick={onCopyApiSecret} size="sm" mt={2}>
                {hasCopiedApiSecret ? 'Copied!' : 'Copy API Secret'}
              </Button>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setApiKeysModalOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MerchantsPage;
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
  CheckboxGroup,
  Checkbox,
  Stack,
  Switch,
  HStack,
  Text,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWebhookSubscriptions, createWebhookSubscription, updateWebhookSubscription, deleteWebhookSubscription } from '@/api/webhooks';
import { WebhookSubscription, WebhookEventType, CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto } from '@/types/webhook';
import { useForm } from 'react-hook-form';

const allEventTypes = Object.values(WebhookEventType);

const WebhooksPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<WebhookSubscription | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateWebhookSubscriptionDto & { isActive?: boolean }>();

  const {
    data: subscriptions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['webhookSubscriptions'],
    queryFn: getWebhookSubscriptions,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: createWebhookSubscription,
    onSuccess: () => {
      toast({ title: 'Webhook subscription created.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['webhookSubscriptions'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error creating subscription.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWebhookSubscriptionDto }) => updateWebhookSubscription(id, data),
    onSuccess: () => {
      toast({ title: 'Webhook subscription updated.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['webhookSubscriptions'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast({ title: 'Error updating subscription.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: deleteWebhookSubscription,
    onSuccess: () => {
      toast({ title: 'Webhook subscription deleted.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['webhookSubscriptions'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error deleting subscription.', description: err.response?.data?.message, status: 'error' });
    },
  });

  const openCreateModal = () => {
    setEditingSubscription(null);
    reset({ callbackUrl: '', eventTypes: [], isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (subscriptionToEdit: WebhookSubscription) => {
    setEditingSubscription(subscriptionToEdit);
    reset({
      callbackUrl: subscriptionToEdit.callbackUrl,
      eventTypes: subscriptionToEdit.eventTypes,
      isActive: subscriptionToEdit.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: CreateWebhookSubscriptionDto & { isActive?: boolean }) => {
    const { isActive, ...submitData } = data; // Separate isActive for update only

    if (editingSubscription) {
      updateSubscriptionMutation.mutate({ id: editingSubscription.id, data: { ...submitData, isActive } });
    } else {
      createSubscriptionMutation.mutate(submitData as CreateWebhookSubscriptionDto);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook subscription?')) {
      deleteSubscriptionMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" />
      </Flex>
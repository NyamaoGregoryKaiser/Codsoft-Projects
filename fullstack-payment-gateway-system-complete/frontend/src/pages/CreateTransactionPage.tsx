import React from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  FormErrorMessage,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Textarea,
  Select,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCharge } from '@/api/transactions';
import { CreateTransactionDto } from '@/types/transaction';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentMethods } from '@/api/paymentMethods'; // Assuming this API exists

const CreateTransactionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateTransactionDto>();

  const {
    data: paymentMethods,
    isLoading: isLoadingPaymentMethods,
    isError: isErrorPaymentMethods,
    error: paymentMethodsError,
  } = useQuery({
    queryKey: ['paymentMethods', user?.merchantId],
    queryFn: () => getPaymentMethods(),
    enabled: !!user?.merchantId,
  });

  const createChargeMutation = useMutation({
    mutationFn: createCharge,
    onSuccess: (data) => {
      toast({
        title: 'Transaction created.',
        description: `Transaction ID: ${data.id}. Status: ${data.status}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate(`/transactions/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Transaction failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const onSubmit = (data: CreateTransactionDto) => {
    createChargeMutation.mutate(data);
  };

  if (isLoadingPaymentMethods) {
    return <Spinner />;
  }

  if (isErrorPaymentMethods) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading payment methods: {paymentMethodsError?.message}
      </Alert>
    );
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <Box p={5}>
        <Heading as="h1" size="xl" mb={6}>Create New Transaction</Heading>
        <Alert status="warning">
          <AlertIcon />
          No active payment methods found for your merchant. Please add a payment method first.
        </Alert>
        <Button mt={4} onClick={() => navigate('/payment-methods')}>Go to Payment Methods</Button>
      </Box>
    );
  }

  return (
    <Box p={5} maxW="container.md" mx="auto">
      <Heading as="h1" size="xl" mb={6}>Create New Transaction</Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={4}>
          <FormControl id="amount" isInvalid={!!errors.amount}>
            <FormLabel>Amount</FormLabel>
            <Input
              type="text" // Use text for amount input to handle decimals better
              {...register('amount', {
                required: 'Amount is required',
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: 'Invalid amount format (e.g., 100.00)',
                },
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              placeholder="e.g., 100.50"
            />
            <FormErrorMessage>{errors.amount && errors.amount.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="currency" isInvalid={!!errors.currency}>
            <FormLabel>Currency</FormLabel>
            <Input
              type="text"
              {...register('currency', {
                required: 'Currency is required',
                pattern: {
                  value: /^[A-Z]{3}$/,
                  message: 'Currency must be a 3-letter uppercase code (e.g., USD)',
                },
              })}
              placeholder="e.g., USD"
            />
            <FormErrorMessage>{errors.currency && errors.currency.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="paymentMethodId" isInvalid={!!errors.paymentMethodId}>
            <FormLabel>Payment Method</FormLabel>
            <Select
              placeholder="Select payment method"
              {...register('paymentMethodId', { required: 'Payment Method is required' })}
            >
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.cardBrand} ending {pm.last4} ({pm.type}) - Exp {pm.expiryMonth}/{pm.expiryYear} {pm.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.paymentMethodId && errors.paymentMethodId.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="customerEmail" isInvalid={!!errors.customerEmail}>
            <FormLabel>Customer Email (Optional)</FormLabel>
            <Input
              type="email"
              {...register('customerEmail', {
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Invalid email format',
                },
              })}
              placeholder="customer@example.com"
            />
            <FormErrorMessage>{errors.customerEmail && errors.customerEmail.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="customerName" isInvalid={!!errors.customerName}>
            <FormLabel>Customer Name (Optional)</FormLabel>
            <Input type="text" {...register('customerName')} placeholder="John Doe" />
            <FormErrorMessage>{errors.customerName && errors.customerName.message}</FormErrorMessage>
          </FormControl>

          <FormControl id="description" isInvalid={!!errors.description}>
            <FormLabel>Description (Optional)</FormLabel>
            <Textarea {...register('description')} placeholder="Description of the transaction" />
            <FormErrorMessage>{errors.description && errors.description.message}</FormErrorMessage>
          </FormControl>

          <Button
            colorScheme="blue"
            type="submit"
            isLoading={isSubmitting || createChargeMutation.isPending}
            loadingText="Processing..."
          >
            Process Charge
          </Button>
        </Stack>
      </form>
    </Box>
  );
};

export default CreateTransactionPage;
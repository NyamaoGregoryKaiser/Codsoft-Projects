import React from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransaction, refundTransaction, voidTransaction } from '@/api/transactions';
import { TransactionStatus, TransactionType } from '@/types/transaction';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

const TransactionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { hasRole } = useAuth();

  const {
    data: transaction,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id!),
    enabled: !!id,
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: string }) =>
      refundTransaction(id, { amount }),
    onSuccess: () => {
      toast({
        title: 'Transaction refunded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Refund failed.',
        description: err.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const voidMutation = useMutation({
    mutationFn: (transactionId: string) => voidTransaction(transactionId),
    onSuccess: () => {
      toast({
        title: 'Transaction voided.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Void failed.',
        description: err.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleRefund = () => {
    if (!transaction) return;
    const availableToRefund = transaction.amount - transaction.refundedAmount;
    const refundAmountInput = prompt(
      `Enter amount to refund (max ${availableToRefund.toFixed(2)} ${transaction.currency}):`,
      availableToRefund.toFixed(2),
    );

    if (refundAmountInput === null) return; // User cancelled
    const refundAmount = parseFloat(refundAmountInput);

    if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > availableToRefund) {
      toast({
        title: 'Invalid refund amount.',
        description: `Please enter a valid amount between 0.01 and ${availableToRefund.toFixed(2)}.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    refundMutation.mutate({ id: transaction.id, amount: refundAmount.toFixed(2) });
  };

  const handleVoid = () => {
    if (!transaction) return;
    if (confirm(`Are you sure you want to void transaction ${transaction.id}? This action cannot be undone.`)) {
      voidMutation.mutate(transaction.id);
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
        Error loading transaction: {error?.message}
      </Alert>
    );
  }

  if (!transaction) {
    return (
      <Box p={5}>
        <Text>Transaction not found.</Text>
      </Box>
    );
  }

  const canRefund = hasRole([UserRole.MERCHANT_USER]) &&
    transaction.type === TransactionType.CHARGE &&
    (transaction.status === TransactionStatus.CAPTURED || transaction.status === TransactionStatus.PARTIALLY_REFUNDED) &&
    transaction.amount > transaction.refundedAmount;

  const canVoid = hasRole([UserRole.MERCHANT_USER]) &&
    transaction.type === TransactionType.CHARGE &&
    transaction.status === TransactionStatus.PENDING;

  return (
    <Box p={5} maxW="container.md" mx="auto">
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">Transaction Details</Heading>
        <Button onClick={() => navigate('/transactions')} colorScheme="teal" variant="outline">
          Back to Transactions
        </Button>
      </Flex>

      <Table variant="simple" size="md" mb={6}>
        <Tbody>
          <Tr>
            <Th>Transaction ID</Th>
            <Td>{transaction.id}</Td>
          </Tr>
          <Tr>
            <Th>Type</Th>
            <Td>{transaction.type}</Td>
          </Tr>
          <Tr>
            <Th>Status</Th>
            <Td>
              <Badge colorScheme={
                transaction.status === TransactionStatus.CAPTURED ? 'green' :
                transaction.status === TransactionStatus.REFUNDED || transaction.status === TransactionStatus.PARTIALLY_REFUNDED ? 'orange' :
                transaction.status === TransactionStatus.VOIDED ? 'gray' :
                transaction.status === TransactionStatus.FAILED ? 'red' : 'blue'
              }>
                {transaction.status.toUpperCase()}
              </Badge>
            </Td>
          </Tr>
          <Tr>
            <Th>Amount</Th>
            <Td>{transaction.amount.toFixed(2)} {transaction.currency}</Td>
          </Tr>
          <Tr>
            <Th>Refunded Amount</Th>
            <Td>{transaction.refundedAmount.toFixed(2)} {transaction.currency}</Td>
          </Tr>
          <Tr>
            <Th>Customer Email</Th>
            <Td>{transaction.customerEmail || 'N/A'}</Td>
          </Tr>
          <Tr>
            <Th>Customer Name</Th>
            <Td>{transaction.customerName || 'N/A'}</Td>
          </Tr>
          <Tr>
            <Th>Description</Th>
            <Td>{transaction.description || 'N/A'}</Td>
          </Tr>
          <Tr>
            <Th>Gateway Txn ID</Th>
            <Td>{transaction.gatewayTransactionId || 'N/A'}</Td>
          </Tr>
          <Tr>
            <Th>Processed By</Th>
            <Td>{transaction.processedById || 'N/A'}</Td> {/* In a real app, join user data */}
          </Tr>
          <Tr>
            <Th>Created At</Th>
            <Td>{new Date(transaction.createdAt).toLocaleString()}</Td>
          </Tr>
          <Tr>
            <Th>Last Updated</Th>
            <Td>{new Date(transaction.updatedAt).toLocaleString()}</Td>
          </Tr>
          <Tr>
            <Th>Metadata</Th>
            <Td>
              <pre>{transaction.metadata ? JSON.stringify(transaction.metadata, null, 2) : 'N/A'}</pre>
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <Flex mt={6} gap={4}>
        {canRefund && (
          <Button
            colorScheme="orange"
            onClick={handleRefund}
            isLoading={refundMutation.isPending}
            loadingText="Refunding..."
          >
            Refund
          </Button>
        )}
        {canVoid && (
          <Button
            colorScheme="red"
            onClick={handleVoid}
            isLoading={voidMutation.isPending}
            loadingText="Voiding..."
          >
            Void
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default TransactionDetailsPage;
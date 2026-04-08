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
  Text,
  useToast,
  Link as ChakraLink,
  Select,
  HStack,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, refundTransaction, voidTransaction } from '@/api/transactions';
import { Link as RouterLink } from 'react-router-dom';
import { Transaction, TransactionStatus, TransactionType } from '@/types/transaction';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

const TransactionsPage = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: paginatedTransactions,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['transactions', page, limit],
    queryFn: () => getTransactions(page, limit),
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] }); // Invalidate summary too
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
    mutationFn: (id: string) => voidTransaction(id),
    onSuccess: () => {
      toast({
        title: 'Transaction voided.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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

  const handleRefund = (transaction: Transaction) => {
    // Implement a modal or prompt for full/partial refund
    const refundAmount = prompt(
      `Enter amount to refund (max ${
        transaction.amount - transaction.refundedAmount
      }):`,
      (transaction.amount - transaction.refundedAmount).toFixed(2),
    );
    if (refundAmount !== null) {
      if (parseFloat(refundAmount) <= 0 || isNaN(parseFloat(refundAmount))) {
        toast({
          title: 'Invalid refund amount.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      refundMutation.mutate({ id: transaction.id, amount: refundAmount });
    }
  };

  const handleVoid = (id: string) => {
    if (confirm('Are you sure you want to void this transaction?')) {
      voidMutation.mutate(id);
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
        Error loading transactions: {error?.message}
      </Alert>
    );
  }

  const transactions = paginatedTransactions?.data || [];
  const { totalPages = 1, totalItems = 0 } = paginatedTransactions || {};

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">Transactions</Heading>
        {hasRole([UserRole.MERCHANT_USER]) && (
          <Button as={RouterLink} to="/transactions/create" colorScheme="blue">
            Create New Transaction
          </Button>
        )}
      </Flex>

      {transactions.length === 0 ? (
        <Text>No transactions found.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th isNumeric>Amount</Th>
                <Th>Currency</Th>
                <Th>Customer Email</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>
                    <ChakraLink as={RouterLink} to={`/transactions/${transaction.id}`} color="blue.500">
                      {transaction.id.substring(0, 8)}...
                    </ChakraLink>
                  </Td>
                  <Td>{transaction.type}</Td>
                  <Td>{transaction.status}</Td>
                  <Td isNumeric>{transaction.amount.toFixed(2)}</Td>
                  <Td>{transaction.currency}</Td>
                  <Td>{transaction.customerEmail || 'N/A'}</Td>
                  <Td>{new Date(transaction.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      {hasRole([UserRole.MERCHANT_USER]) &&
                        transaction.type === TransactionType.CHARGE &&
                        (transaction.status === TransactionStatus.CAPTURED ||
                          transaction.status === TransactionStatus.PARTIALLY_REFUNDED) && (
                          <Button
                            size="xs"
                            colorScheme="orange"
                            onClick={() => handleRefund(transaction)}
                            isLoading={refundMutation.isPending}
                          >
                            Refund
                          </Button>
                        )}
                      {hasRole([UserRole.MERCHANT_USER]) &&
                        transaction.type === TransactionType.CHARGE &&
                        transaction.status === TransactionStatus.PENDING && (
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={() => handleVoid(transaction.id)}
                            isLoading={voidMutation.isPending}
                          >
                            Void
                          </Button>
                        )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {totalItems > 0 && (
        <Flex justifyContent="space-between" alignItems="center" mt={4}>
          <Text>
            Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, totalItems)} of {totalItems} transactions
          </Text>
          <HStack>
            <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} isDisabled={page === 1}>
              Previous
            </Button>
            <Select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </Select>
            <Button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} isDisabled={page === totalPages}>
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </Box>
  );
};

export default TransactionsPage;
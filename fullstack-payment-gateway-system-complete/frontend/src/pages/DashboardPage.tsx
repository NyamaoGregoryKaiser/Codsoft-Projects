import React from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  Flex,
  Button,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { getTransactionSummary, getDailyTransactions } from '@/api/reporting';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Link as RouterLink } from 'react-router-dom';

const DashboardPage = () => {
  const { user, hasRole } = useAuth();
  const isMerchantUser = hasRole([UserRole.MERCHANT_USER]);

  // For simplicity, fetching a summary for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date();

  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    error: errorSummary,
  } = useQuery({
    queryKey: ['transactionSummary', user?.merchantId],
    queryFn: () => getTransactionSummary({
      startDate: thirtyDaysAgo.toISOString(),
      endDate: today.toISOString(),
    }),
    enabled: isMerchantUser && !!user?.merchantId,
  });

  const {
    data: dailyReport,
    isLoading: isLoadingDaily,
    isError: isErrorDaily,
    error: errorDaily,
  } = useQuery({
    queryKey: ['dailyTransactions', user?.merchantId],
    queryFn: () => getDailyTransactions({
      startDate: thirtyDaysAgo.toISOString(),
      endDate: today.toISOString(),
    }),
    enabled: isMerchantUser && !!user?.merchantId,
  });

  if (isLoadingSummary || isLoadingDaily) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isErrorSummary || isErrorDaily) {
    return (
      <Alert status="error">
        <AlertIcon />
        Error loading dashboard data: {errorSummary?.message || errorDaily?.message}
      </Alert>
    );
  }

  if (hasRole([UserRole.ADMIN])) {
    return (
      <Box p={5}>
        <Heading as="h1" size="xl" mb={6}>Admin Dashboard</Heading>
        <Text mb={4}>
          Welcome, Admin! From here you can manage all merchants and system-wide users.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Button as={RouterLink} to="/merchants" colorScheme="blue">Manage Merchants</Button>
          <Button as={RouterLink} to="/users" colorScheme="blue">Manage All Users</Button>
        </SimpleGrid>
      </Box>
    )
  }

  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={6}>Merchant Dashboard</Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
          <StatLabel>Total Captured</StatLabel>
          <StatNumber fontSize="2xl">${summary?.totalSuccessfulCharges?.toFixed(2) || '0.00'}</StatNumber>
          <StatHelpText>{summary?.successfulChargeCount || 0} transactions</StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
          <StatLabel>Total Refunded</StatLabel>
          <StatNumber fontSize="2xl">${summary?.totalRefundedAmount?.toFixed(2) || '0.00'}</StatNumber>
          <StatHelpText>{summary?.refundCount || 0} refunds</StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
          <StatLabel>Net Volume</StatLabel>
          <StatNumber fontSize="2xl">${summary?.netVolume?.toFixed(2) || '0.00'}</StatNumber>
          <StatHelpText>Last 30 days</StatHelpText>
        </Stat>

        <Stat p={5} shadow="md" borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
          <StatLabel>Failed Transactions</StatLabel>
          <StatNumber fontSize="2xl">{summary?.totalFailedTransactions || 0}</StatNumber>
          <StatHelpText>Last 30 days</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Heading as="h2" size="lg" mb={4}>Daily Performance (Last 30 Days)</Heading>
      <Box overflowX="auto">
        {/* Simple table for daily data, could be a chart in a real app */}
        {dailyReport && dailyReport.length > 0 ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th isNumeric>Captured Amount</Th>
                <Th isNumeric>Captured Count</Th>
                <Th isNumeric>Refunded Amount</Th>
                <Th isNumeric>Refund Count</Th>
                <Th isNumeric>Failed Count</Th>
                <Th isNumeric>Net Volume</Th>
              </Tr>
            </Thead>
            <Tbody>
              {dailyReport.map((day) => (
                <Tr key={day.date}>
                  <Td>{day.date}</Td>
                  <Td isNumeric>${day.capturedAmount.toFixed(2)}</Td>
                  <Td isNumeric>{day.capturedCount}</Td>
                  <Td isNumeric>${day.refundedAmount.toFixed(2)}</Td>
                  <Td isNumeric>{day.refundCount}</Td>
                  <Td isNumeric>{day.failedCount}</Td>
                  <Td isNumeric>${day.netVolume.toFixed(2)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Text>No daily transaction data available for the last 30 days.</Text>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;
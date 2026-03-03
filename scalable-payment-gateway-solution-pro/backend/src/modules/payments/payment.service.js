const httpStatus = require('http-status');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const accountService = require('../accounts/account.service');
const logger = require('../../utils/logger');

// Simulate a payment gateway interaction
const processExternalPayment = async (accountId, amount, currency, cardDetails) => {
  logger.info(`Simulating payment processing for account ${accountId}, amount ${amount} ${currency}`);
  // In a real system:
  // 1. Call a real payment gateway (Stripe, PayPal, etc.)
  // 2. Handle success/failure, webhooks, 3D Secure, etc.
  // 3. Store gateway transaction ID, status, etc.

  // Simulate a delay and potential failure
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const isSuccess = Math.random() > 0.1; // 90% success rate
  const gatewayTransactionId = `gtw_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  if (!isSuccess) {
    logger.warn('Simulated payment failed for account:', accountId);
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'Payment gateway rejected the transaction.');
  }

  logger.info('Simulated payment successful, gateway ID:', gatewayTransactionId);
  return {
    gatewayTransactionId,
    status: 'succeeded',
    message: 'Payment processed successfully by simulated gateway',
  };
};

const initiatePayment = async (userId, accountId, amount, currency, cardDetails) => {
  // 1. Create a pending payment record
  const [paymentId] = await db('payments').insert({
    user_id: userId,
    account_id: accountId,
    amount,
    currency,
    status: 'pending',
    type: 'charge',
    gateway_response: {},
  }).returning('id');

  let paymentRecord = await db('payments').where({ id: paymentId }).first();

  try {
    // 2. Process payment with external gateway
    const gatewayResult = await processExternalPayment(accountId, amount, currency, cardDetails);

    // 3. Update payment record with gateway response
    await db('payments').where({ id: paymentId }).update({
      status: gatewayResult.status === 'succeeded' ? 'completed' : 'failed',
      gateway_transaction_id: gatewayResult.gatewayTransactionId,
      gateway_response: gatewayResult,
    });
    paymentRecord = await db('payments').where({ id: paymentId }).first();

    if (gatewayResult.status === 'succeeded') {
      // 4. Update internal account balance (credit the user's account)
      await accountService.updateAccountBalance(accountId, amount, 'credit', paymentId);

      // 5. Create an internal transaction record for the payment
      await db('transactions').insert({
        user_id: userId,
        to_account_id: accountId,
        amount,
        currency,
        type: 'payment_in',
        status: 'completed',
        description: `Payment from external source. Gateway ID: ${gatewayResult.gatewayTransactionId}`,
        reference_id: paymentId, // Link to payment table
      });
    }

    return paymentRecord;

  } catch (error) {
    // Handle payment gateway failure
    await db('payments').where({ id: paymentId }).update({
      status: 'failed',
      gateway_response: { error: error.message || 'Payment processing failed' },
    });
    paymentRecord = await db('payments').where({ id: paymentId }).first();
    logger.error('Payment initiation failed:', error);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Payment could not be processed.');
  }
};

const getPaymentById = async (paymentId, userId) => {
  const payment = await db('payments').where({ id: paymentId, user_id: userId }).first();
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found or not owned by user');
  }
  return payment;
};

const getPaymentsByUserId = async (userId) => {
  return db('payments').where({ user_id: userId }).orderBy('createdAt', 'desc');
};


module.exports = {
  initiatePayment,
  getPaymentById,
  getPaymentsByUserId,
};
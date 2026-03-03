const httpStatus = require('http-status');
const paymentService = require('./payment.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const initiatePayment = async (req, res, next) => {
  try {
    const { accountId, amount, currency, cardDetails } = req.body;
    // Basic validation
    if (!accountId || !amount || !currency || !cardDetails) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required payment details');
    }

    const payment = await paymentService.initiatePayment(
      req.user.id,
      accountId,
      amount,
      currency,
      cardDetails
    );
    res.status(httpStatus.CREATED).send(payment);
  } catch (error) {
    logger.error('Initiate payment error:', error);
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.paymentId, req.user.id);
    res.send(payment);
  } catch (error) {
    logger.error('Get payment by ID error:', error);
    next(error);
  }
};

const getUserPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentsByUserId(req.user.id);
    res.send(payments);
  } catch (error) {
    logger.error('Get user payments error:', error);
    next(error);
  }
};

module.exports = {
  initiatePayment,
  getPaymentById,
  getUserPayments,
};
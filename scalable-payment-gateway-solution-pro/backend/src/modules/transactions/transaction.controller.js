const httpStatus = require('http-status');
const transactionService = require('./transaction.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const createTransfer = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction({
      fromAccountId: req.body.fromAccountId,
      toAccountId: req.body.toAccountId,
      amount: req.body.amount,
      description: req.body.description,
      userId: req.user.id, // User initiating the transfer must own the source account
    });
    res.status(httpStatus.CREATED).send(transaction);
  } catch (error) {
    logger.error('Create transfer error:', error);
    next(error);
  }
};

const createDeposit = async (req, res, next) => {
  try {
    const transaction = await transactionService.createDepositOrWithdrawal(
      req.body.accountId,
      req.body.amount,
      'deposit',
      req.body.description,
      req.user.id // Ensure user owns the account
    );
    res.status(httpStatus.CREATED).send(transaction);
  } catch (error) {
    logger.error('Create deposit error:', error);
    next(error);
  }
};

const createWithdrawal = async (req, res, next) => {
  try {
    const transaction = await transactionService.createDepositOrWithdrawal(
      req.body.accountId,
      req.body.amount,
      'withdrawal',
      req.body.description,
      req.user.id // Ensure user owns the account
    );
    res.status(httpStatus.CREATED).send(transaction);
  } catch (error) {
    logger.error('Create withdrawal error:', error);
    next(error);
  }
};

const getAccountTransactions = async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit, 10) || 10,
      page: parseInt(req.query.page, 10) || 1,
      sortBy: req.query.sortBy || 'createdAt:desc',
    };
    const result = await transactionService.getTransactionsByAccountId(
      req.params.accountId,
      req.user.id,
      options
    );
    res.send(result);
  } catch (error) {
    logger.error('Get account transactions error:', error);
    next(error);
  }
};

module.exports = {
  createTransfer,
  createDeposit,
  createWithdrawal,
  getAccountTransactions,
};
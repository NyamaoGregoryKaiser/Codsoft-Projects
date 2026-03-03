const httpStatus = require('http-status');
const accountService = require('./account.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const createAccount = async (req, res, next) => {
  try {
    const account = await accountService.createAccount(req.user.id, req.body.currency);
    res.status(httpStatus.CREATED).send(account);
  } catch (error) {
    logger.error('Create account error:', error);
    next(error);
  }
};

const getAccounts = async (req, res, next) => {
  try {
    const accounts = await accountService.getAccountsByUserId(req.user.id);
    res.send(accounts);
  } catch (error) {
    logger.error('Get accounts error:', error);
    next(error);
  }
};

const getAccountById = async (req, res, next) => {
  try {
    const account = await accountService.getAccountById(req.params.accountId, req.user.id);
    res.send(account);
  } catch (error) {
    logger.error('Get account by ID error:', error);
    next(error);
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
};
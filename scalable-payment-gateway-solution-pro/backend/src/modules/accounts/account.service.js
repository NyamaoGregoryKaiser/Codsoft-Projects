const httpStatus = require('http-status');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const createAccount = async (userId, currency = 'USD') => {
  // Check if user already has an account with this currency
  const existingAccount = await db('accounts')
    .where({ user_id: userId, currency })
    .first();
  if (existingAccount) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Account with ${currency} already exists for this user.`);
  }

  const [accountId] = await db('accounts').insert({
    user_id: userId,
    balance: 0,
    currency,
    account_number: `ACC-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Simple unique number
  }).returning('id');

  return db('accounts').where({ id: accountId }).first();
};

const getAccountById = async (accountId, userId) => {
  const account = await db('accounts').where({ id: accountId, user_id: userId }).first();
  if (!account) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found or not owned by user');
  }
  return account;
};

const getAccountsByUserId = async (userId) => {
  return db('accounts').where({ user_id: userId });
};

const updateAccountBalance = async (accountId, amount, type, transactionId = null) => {
  return db.transaction(async (trx) => {
    const account = await trx('accounts').where({ id: accountId }).first();
    if (!account) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
    }

    let newBalance;
    if (type === 'credit') { // Deposit, incoming transfer, payment capture
      newBalance = account.balance + amount;
    } else if (type === 'debit') { // Withdrawal, outgoing transfer, payment refund
      if (account.balance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient funds');
      }
      newBalance = account.balance - amount;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid balance update type');
    }

    await trx('accounts').where({ id: accountId }).update({ balance: newBalance });

    // Link balance update to a transaction if provided
    if (transactionId) {
      // In a real system, you might have an account_history table
      // For now, we assume the transaction record itself is sufficient.
    }

    return trx('accounts').where({ id: accountId }).first();
  });
};

module.exports = {
  createAccount,
  getAccountById,
  getAccountsByUserId,
  updateAccountBalance,
};
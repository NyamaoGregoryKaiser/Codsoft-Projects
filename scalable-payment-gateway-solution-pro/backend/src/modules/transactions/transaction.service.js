const httpStatus = require('http-status');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const accountService = require('../accounts/account.service');
const logger = require('../../utils/logger');

const createTransaction = async (data) => {
  const { fromAccountId, toAccountId, amount, type, description, userId } = data;

  if (amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transaction amount must be positive');
  }

  return db.transaction(async (trx) => {
    // Validate source account and ensure it belongs to the user
    const fromAccount = await trx('accounts').where({ id: fromAccountId, user_id: userId }).first();
    if (!fromAccount) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Source account not found or not owned by user');
    }
    if (fromAccount.balance < amount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient funds in source account');
    }

    // Validate destination account
    const toAccount = await trx('accounts').where({ id: toAccountId }).first();
    if (!toAccount) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Destination account not found');
    }

    if (fromAccount.currency !== toAccount.currency) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Currency mismatch between accounts');
    }

    // Debit source account
    await trx('accounts')
      .where({ id: fromAccountId })
      .decrement('balance', amount);

    // Credit destination account
    await trx('accounts')
      .where({ id: toAccountId })
      .increment('balance', amount);

    const [transactionId] = await trx('transactions').insert({
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      user_id: userId, // User initiating the transfer
      amount,
      currency: fromAccount.currency,
      type: 'transfer', // This service handles transfers
      status: 'completed',
      description: description || `Transfer from ${fromAccount.account_number} to ${toAccount.account_number}`,
    }).returning('id');

    return trx('transactions').where({ id: transactionId }).first();
  });
};

// Simplified direct deposit/withdrawal (e.g., from an external source or admin)
const createDepositOrWithdrawal = async (accountId, amount, type, description, userId = null) => {
  if (amount <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Amount must be positive');
  }

  return db.transaction(async (trx) => {
    const account = await trx('accounts').where({ id: accountId }).first();
    if (!account) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Account not found');
    }
    // If userId is provided, ensure account belongs to user (for user-initiated actions)
    if (userId && account.user_id !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Account not owned by user');
    }

    let newBalance;
    if (type === 'deposit') {
      newBalance = account.balance + amount;
    } else if (type === 'withdrawal') {
      if (account.balance < amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient funds');
      }
      newBalance = account.balance - amount;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid transaction type');
    }

    await trx('accounts').where({ id: accountId }).update({ balance: newBalance });

    const [transactionId] = await trx('transactions').insert({
      from_account_id: type === 'withdrawal' ? accountId : null,
      to_account_id: type === 'deposit' ? accountId : null,
      user_id: account.user_id, // The user whose account is affected
      amount,
      currency: account.currency,
      type: type,
      status: 'completed',
      description: description || `${type} to account ${account.account_number}`,
    }).returning('id');

    return trx('transactions').where({ id: transactionId }).first();
  });
};


const getTransactionsByAccountId = async (accountId, userId, options) => {
  const account = await db('accounts').where({ id: accountId, user_id: userId }).first();
  if (!account) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Account not found or not owned by user');
  }

  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const offset = (page - 1) * limit;

  const transactions = await db('transactions')
    .where((builder) => {
      builder.where('from_account_id', accountId).orWhere('to_account_id', accountId);
    })
    .limit(limit)
    .offset(offset)
    .orderBy(sortBy.split(':')[0], sortBy.split(':')[1]);

  const totalResults = await db('transactions')
    .where((builder) => {
      builder.where('from_account_id', accountId).orWhere('to_account_id', accountId);
    })
    .count('id as count')
    .first();

  return {
    results: transactions,
    page,
    limit,
    totalPages: Math.ceil(totalResults.count / limit),
    totalResults: totalResults.count,
  };
};

module.exports = {
  createTransaction,
  createDepositOrWithdrawal,
  getTransactionsByAccountId,
};
const express = require('express');
const auth = require('../../middleware/auth.middleware');
const transactionController = require('./transaction.controller');

const router = express.Router();

router.post('/transfer', auth(), transactionController.createTransfer);
router.post('/deposit', auth(), transactionController.createDeposit);
router.post('/withdrawal', auth(), transactionController.createWithdrawal);
router.get('/account/:accountId', auth(), transactionController.getAccountTransactions);

module.exports = router;
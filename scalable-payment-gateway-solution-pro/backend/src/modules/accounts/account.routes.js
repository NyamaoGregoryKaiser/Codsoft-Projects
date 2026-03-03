const express = require('express');
const auth = require('../../middleware/auth.middleware');
const accountController = require('./account.controller');

const router = express.Router();

router.route('/')
  .post(auth(), accountController.createAccount)
  .get(auth(), accountController.getAccounts);

router.route('/:accountId')
  .get(auth(), accountController.getAccountById);

module.exports = router;
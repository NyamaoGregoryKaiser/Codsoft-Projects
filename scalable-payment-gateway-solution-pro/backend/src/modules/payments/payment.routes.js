const express = require('express');
const auth = require('../../middleware/auth.middleware');
const paymentController = require('./payment.controller');

const router = express.Router();

router.post('/', auth(), paymentController.initiatePayment);
router.get('/:paymentId', auth(), paymentController.getPaymentById);
router.get('/', auth(), paymentController.getUserPayments);

module.exports = router;
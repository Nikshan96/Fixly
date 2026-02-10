const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
	getPaymentForBooking,
	preparePaymentForBooking,
	initiateEsewaPayment,
	verifyEsewaPayment,
	initiateKhaltiPayment,
	verifyKhaltiPayment,
} = require('../controllers/payment.controller');

router.get('/booking/:bookingId', protect, authorizeRoles('customer'), getPaymentForBooking);
router.post('/booking/:bookingId/prepare', protect, authorizeRoles('customer'), preparePaymentForBooking);
router.post('/esewa/initiate', protect, authorizeRoles('customer'), initiateEsewaPayment);
router.post('/esewa/verify', protect, authorizeRoles('customer'), verifyEsewaPayment);
router.post('/khalti/initiate', protect, authorizeRoles('customer'), initiateKhaltiPayment);
router.post('/khalti/verify', protect, authorizeRoles('customer'), verifyKhaltiPayment);

module.exports = router;
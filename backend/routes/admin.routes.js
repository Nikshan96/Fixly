const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Apply global middleware: only authenticated admins
router.use(protect, authorizeRoles('admin'));

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats);

// Users Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Technicians Management
router.get('/technicians', adminController.getAllTechnicians);
router.get('/technicians/service/:serviceId', adminController.getTechniciansByService);
router.post('/technicians', upload.single('profile_image'), adminController.createTechnician);
router.put('/technicians/:id/status', adminController.updateTechnicianStatus);

// Bookings/Jobs Management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.put('/bookings/:id/status', adminController.updateBookingStatus);
router.put('/bookings/:id', adminController.updateBooking);

// Services Management
router.get('/services', adminController.getAllServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Revenue Management
router.get('/revenue', adminController.getRevenueStats);
router.get('/revenue/monthly', adminController.getMonthlyRevenue);
router.get('/finance/overview', adminController.getFinanceOverview);
router.get('/payments', adminController.getPaymentHistory);
router.get('/payout-settlements', adminController.getPayoutSettlements);
router.post('/payout-settlements/settle', adminController.markPayoutSettled);

// Reviews Management
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', adminController.deleteReview);


// Admin Profile (with image upload)
router.put('/profile', upload.single('profile_image'), adminController.updateProfile);

// Change Admin Password
router.put('/change-password', adminController.changePassword);

// Notification Management
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);

module.exports = router;
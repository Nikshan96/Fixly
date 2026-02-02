const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const {
  getServices,
  createBooking,
  getMyBookings,
  getMyPaymentHistory,
  cancelBooking,
  updateProfile,
  changePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/customer.controller');

// ─── Public Routes ────────────────────────────────────────────────────────────
// Get all active services - no auth needed
router.get('/services', getServices);

// ─── Protected Routes (Customer only) ────────────────────────────────────────
// Bookings
router.post('/bookings', protect, authorizeRoles('customer'), upload.single('photo'), createBooking);
router.get('/bookings', protect, authorizeRoles('customer'), getMyBookings);
router.get('/payments', protect, authorizeRoles('customer'), getMyPaymentHistory);
router.put('/bookings/:id/cancel', protect, authorizeRoles('customer'), cancelBooking);

// Profile
router.put(
  '/profile',
  protect,
  authorizeRoles('customer'),
  upload.single('profile_image'),
  updateProfile
);

// Password
router.put('/change-password', protect, authorizeRoles('customer'), changePassword);

// Notifications
router.get('/notifications', protect, authorizeRoles('customer'), getNotifications);
router.put('/notifications/:id/read', protect, authorizeRoles('customer'), markNotificationRead);
router.put('/notifications/read-all', protect, authorizeRoles('customer'), markAllNotificationsRead);

module.exports = router;
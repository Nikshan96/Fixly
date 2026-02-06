const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technician.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');

router.get('/health', (req, res) => {
	res.json({
		success: true,
		message: 'Technician routes ready'
	});
});

router.use(protect, authorizeRoles('technician'));

router.get('/dashboard', technicianController.getDashboard);
router.get('/jobs/available', technicianController.getAvailableJobs);
router.get('/jobs/my', technicianController.getMyJobs);
router.get('/jobs/completed', technicianController.getCompletedJobs);
router.get('/jobs/closed', technicianController.getClosedJobs);
router.get('/earnings', technicianController.getEarnings);
router.post('/jobs/:id/accept', technicianController.acceptJob);
router.post('/jobs/:id/start', technicianController.startJob);
router.post('/jobs/:id/complete', technicianController.completeJob);
router.get('/profile', technicianController.getProfile);
router.put('/profile', technicianController.updateProfile);
router.put('/change-password', technicianController.changePassword);
router.get('/notifications', technicianController.getNotifications);
router.put('/notifications/:id/read', technicianController.markNotificationRead);
router.put('/notifications/read-all', technicianController.markAllNotificationsRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');

router.use(protect, authorizeRoles('admin', 'customer', 'technician'));

router.get('/conversations', messagesController.listConversations);
router.get('/conversations/:id/messages', messagesController.getConversationMessages);
router.post('/conversations/:id/messages', messagesController.sendConversationMessage);

router.get('/support/technicians', messagesController.listSupportTechnicians);
router.get('/support/conversations', messagesController.listSupportConversations);
router.post('/support/conversations/:technicianId', messagesController.createOrGetSupportConversation);
router.get('/support/conversations/:id/messages', messagesController.getSupportConversationMessages);
router.post('/support/conversations/:id/messages', messagesController.sendSupportConversationMessage);

module.exports = router;

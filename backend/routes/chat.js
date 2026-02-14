const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/unread-count",         ctrl.getUnreadCount);
router.get("/:jobId/messages",      ctrl.getMessages);
router.post("/:jobId/messages",     ctrl.sendMessage);

module.exports = router;

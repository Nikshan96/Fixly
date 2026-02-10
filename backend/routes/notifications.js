const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/",            ctrl.getNotifications);
router.put("/read-all",    ctrl.markAllRead);
router.put("/:id/read",    ctrl.markOneRead);
router.delete("/:id",      ctrl.deleteNotification);

module.exports = router;

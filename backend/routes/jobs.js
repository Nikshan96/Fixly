const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/jobController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/available",         ctrl.getAvailableJobs);
router.get("/my",                ctrl.getMyJobs);
router.get("/completed",         ctrl.getCompletedJobs);
router.get("/earnings",          ctrl.getEarnings);
router.post("/:id/accept",       requireRole("technician"), ctrl.acceptJob);
router.post("/:id/decline",      requireRole("technician"), ctrl.declineJob);
router.post("/:id/complete",     requireRole("technician"), ctrl.completeJob);

module.exports = router;

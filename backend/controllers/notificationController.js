const { Notification } = require("../models");

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const rows = await Notification.findAll({
      where: { recipient: req.user._id },
      order: [["createdAt", "DESC"]],
    });
    const notifs = rows.map((r) => r.toJSON());
    res.json({ success: true, data: notifs });
  } catch (err) { next(err); }
};

// PUT /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ read: true }, { where: { recipient: req.user._id } });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
};

// PUT /api/notifications/:id/read
exports.markOneRead = async (req, res, next) => {
  try {
     await Notification.update(
      { read: true },
      { where: { _id: req.params.id, recipient: req.user._id } }
     );
     res.json({ success: true });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { _id: req.params.id, recipient: req.user._id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

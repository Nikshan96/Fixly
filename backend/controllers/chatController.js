const { randomUUID } = require("crypto");
const { Message, User } = require("../models");

const attachSender = async (msg) => {
  const sender = await User.findByPk(msg.sender);
  return {
    ...msg.toJSON(),
    sender: sender
      ? {
          _id: sender._id,
          name: sender.name,
          avatar: sender.avatar || "https://i.pravatar.cc/150?u=fake",
        }
      : {
          _id: msg.sender,
          name: "Unknown",
          avatar: "https://i.pravatar.cc/150?u=fake",
        },
  };
};

// GET /api/chat/:jobId/messages
exports.getMessages = async (req, res, next) => {
  try {
    const conversationId = `job_${req.params.jobId}`;
    const rows = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
    });

    for (const row of rows) {
      if (!row.readBy.includes(req.user._id)) {
        row.readBy = [...row.readBy, req.user._id];
        await row.save();
      }
    }

    const data = await Promise.all(rows.map(attachSender));
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/chat/:jobId/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { text, imageUrl } = req.body;
    const conversationId = `job_${req.params.jobId}`;

    const created = await Message.create({
      _id: `msg_${randomUUID()}`,
      conversationId,
      sender: req.user._id,
      text: text || "",
      imageUrl: imageUrl || null,
      type: imageUrl ? "image" : "text",
      readBy: [req.user._id],
    });

    res.json({ success: true, data: await attachSender(created) });
  } catch (err) { next(err); }
};

// GET /api/chat/unread
exports.getUnreadCount = async (req, res, next) => {
  try {
    const rows = await Message.findAll();
    const count = rows.filter((m) => !m.readBy.includes(req.user._id)).length;
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

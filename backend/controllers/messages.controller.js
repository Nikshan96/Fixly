const { Op } = require('sequelize');
const {
  Conversation,
  Message,
  Booking,
  User,
  TechnicianSupportConversation,
  TechnicianSupportMessage,
  Notification,
} = require('../models');

const serializeMessage = (msg) => ({
  id: msg.id,
  conversation_id: msg.conversation_id,
  sender_id: msg.sender_id,
  message: msg.message,
  is_read: msg.is_read,
  created_at: msg.created_at,
});

const getConversationScope = (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'customer') return { customer_id: user.id };
  if (user.role === 'technician') return { technician_id: user.id };
  return { id: -1 };
};

const serializeSupportMessage = (msg) => ({
  id: msg.id,
  conversation_id: msg.conversation_id,
  sender_id: msg.sender_id,
  message: msg.message,
  is_read: msg.is_read,
  created_at: msg.created_at,
});

const getSupportScope = (user) => {
  if (user.role === 'admin') return { admin_id: user.id };
  if (user.role === 'technician') return { technician_id: user.id };
  return { id: -1 };
};

const shortText = (value, limit = 80) => {
  const text = String(value || '').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}...`;
};

exports.listConversations = async (req, res) => {
  try {
    const where = {
      ...getConversationScope(req.user),
      is_active: true,
    };

    const conversations = await Conversation.findAll({
      where,
      include: [
        { model: Booking, as: 'booking', attributes: ['id', 'status', 'service_id', 'booking_date', 'booking_time', 'location'] },
        { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email'] },
      ],
      order: [['last_message_at', 'DESC'], ['updated_at', 'DESC']],
    });

    const withMeta = await Promise.all(
      conversations.map(async (conv) => {
        const [lastMessage, unreadCount] = await Promise.all([
          Message.findOne({
            where: { conversation_id: conv.id },
            order: [['created_at', 'DESC']],
          }),
          Message.count({
            where: {
              conversation_id: conv.id,
              sender_id: { [Op.ne]: req.user.id },
              is_read: false,
            },
          }),
        ]);

        return {
          ...conv.toJSON(),
          last_message: lastMessage ? serializeMessage(lastMessage) : null,
          unread_count: unreadCount,
        };
      })
    );

    return res.json({ success: true, data: withMeta });
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const conversation = await Conversation.findByPk(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (
      req.user.role !== 'admin' &&
      conversation.customer_id !== req.user.id &&
      conversation.technician_id !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const messages = await Message.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'ASC']],
    });

    await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: req.user.id },
          is_read: false,
        },
      }
    );

    return res.json({
      success: true,
      data: {
        conversation_id: conversationId,
        messages: messages.map(serializeMessage),
      },
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendConversationMessage = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin can view customer-technician conversation only in read-only mode',
      });
    }

    const conversationId = Number(req.params.id);
    const text = String(req.body.message || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (
      req.user.role !== 'admin' &&
      conversation.customer_id !== req.user.id &&
      conversation.technician_id !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const created = await Message.create({
      conversation_id: conversationId,
      sender_id: req.user.id,
      message: text,
      is_read: false,
      read_at: null,
    });

    conversation.last_message_at = new Date();
    await conversation.save();

    const io = req.app.get('io');
    const payload = serializeMessage(created);
    if (io) {
      io.to(`conversation_${conversationId}`).emit('chat:message', payload);
    }

    const senderName = req.user.name || (req.user.role === 'technician' ? 'Technician' : 'Customer');
    const preview = shortText(text, 90);
    const bookingId = conversation.booking_id;
    const recipientIds = [conversation.customer_id, conversation.technician_id]
      .filter((id) => id && id !== req.user.id);

    for (const recipientId of recipientIds) {
      const recipientIsCustomer = Number(recipientId) === Number(conversation.customer_id);
      const link = recipientIsCustomer
        ? `/messages?conversationId=${conversationId}&bookingId=${bookingId}`
        : `/technician/dashboard?tab=chat&conversationId=${conversationId}&bookingId=${bookingId}`;

      const notification = await Notification.create({
        user_id: recipientId,
        type: 'support_ticket',
        title: 'New Chat Message',
        message: `${senderName}: "${preview}"`,
        icon: 'message-circle',
        color: 'blue',
        is_read: false,
        link,
      });

      if (io) {
        io.to(`user_${recipientId}`).emit('notification:new', {
          id: notification.id,
          type: 'support_ticket',
          title: notification.title,
          message: notification.message,
          conversation_id: conversationId,
          booking_id: bookingId,
          link,
          created_at: notification.created_at,
          is_read: false,
        });
      }
    }

    return res.status(201).json({ success: true, data: serializeMessage(created) });
  } catch (error) {
    console.error('Send conversation message error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listSupportTechnicians = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const technicians = await User.findAll({
      where: { role: 'technician', is_active: true },
      attributes: ['id', 'name', 'email', 'phone'],
      order: [['name', 'ASC']],
    });

    return res.json({ success: true, data: technicians });
  } catch (error) {
    console.error('List support technicians error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createOrGetSupportConversation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const technicianId = Number(req.params.technicianId);
    const technician = await User.findOne({
      where: { id: technicianId, role: 'technician' },
      attributes: ['id', 'name', 'email', 'phone'],
    });

    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    const [conversation] = await TechnicianSupportConversation.findOrCreate({
      where: {
        admin_id: req.user.id,
        technician_id: technicianId,
      },
      defaults: {
        admin_id: req.user.id,
        technician_id: technicianId,
        is_active: true,
      },
    });

    if (!conversation.is_active) {
      conversation.is_active = true;
      await conversation.save();
    }

    return res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create support conversation error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listSupportConversations = async (req, res) => {
  try {
    if (!['admin', 'technician'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const conversations = await TechnicianSupportConversation.findAll({
      where: {
        ...getSupportScope(req.user),
        is_active: true,
      },
      include: [
        { model: User, as: 'admin', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email'] },
      ],
      order: [['last_message_at', 'DESC'], ['updated_at', 'DESC']],
    });

    const withMeta = await Promise.all(
      conversations.map(async (conv) => {
        const [lastMessage, unreadCount] = await Promise.all([
          TechnicianSupportMessage.findOne({
            where: { conversation_id: conv.id },
            order: [['created_at', 'DESC']],
          }),
          TechnicianSupportMessage.count({
            where: {
              conversation_id: conv.id,
              sender_id: { [Op.ne]: req.user.id },
              is_read: false,
            },
          }),
        ]);

        return {
          ...conv.toJSON(),
          last_message: lastMessage ? serializeSupportMessage(lastMessage) : null,
          unread_count: unreadCount,
        };
      })
    );

    return res.json({ success: true, data: withMeta });
  } catch (error) {
    console.error('List support conversations error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getSupportConversationMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const conversation = await TechnicianSupportConversation.findByPk(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Support conversation not found' });
    }

    const isAllowed =
      (req.user.role === 'admin' && conversation.admin_id === req.user.id) ||
      (req.user.role === 'technician' && conversation.technician_id === req.user.id);

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const messages = await TechnicianSupportMessage.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'ASC']],
    });

    await TechnicianSupportMessage.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: req.user.id },
          is_read: false,
        },
      }
    );

    return res.json({
      success: true,
      data: {
        conversation_id: conversationId,
        messages: messages.map(serializeSupportMessage),
      },
    });
  } catch (error) {
    console.error('Get support conversation messages error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendSupportConversationMessage = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const text = String(req.body.message || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const conversation = await TechnicianSupportConversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Support conversation not found' });
    }

    const isAllowed =
      (req.user.role === 'admin' && conversation.admin_id === req.user.id) ||
      (req.user.role === 'technician' && conversation.technician_id === req.user.id);

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const created = await TechnicianSupportMessage.create({
      conversation_id: conversationId,
      sender_id: req.user.id,
      message: text,
      is_read: false,
      read_at: null,
    });

    conversation.last_message_at = new Date();
    await conversation.save();

    const recipientId = req.user.role === 'admin' ? conversation.technician_id : conversation.admin_id;
    const senderName = req.user.name || (req.user.role === 'admin' ? 'Admin' : 'Technician');
    const preview = shortText(text, 90);
    const link = req.user.role === 'admin'
      ? `/technician/dashboard?tab=chat`
      : `/admin/messages?tab=support&supportConversationId=${conversationId}`;

    const notification = await Notification.create({
      user_id: recipientId,
      type: 'support_ticket',
      title: 'Technician Support Message',
      message: `${senderName}: "${preview}"`,
      icon: 'message-circle',
      color: 'blue',
      is_read: false,
      link,
    });

    const io = req.app.get('io');
    if (io) {
      const payload = serializeSupportMessage(created);
      io.to(`support_conversation_${conversationId}`).emit('support:message', payload);
      io.to(`user_${recipientId}`).emit('notification:new', {
        id: notification.id,
        type: 'support_ticket',
        title: notification.title,
        message: notification.message,
        link,
        support_conversation_id: conversationId,
        created_at: notification.created_at,
        is_read: false,
      });
    }

    return res.status(201).json({ success: true, data: serializeSupportMessage(created) });
  } catch (error) {
    console.error('Send support conversation message error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

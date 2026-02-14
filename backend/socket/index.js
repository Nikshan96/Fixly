const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Conversation, Message } = require('../models');

let ioInstance = null;

const serializeMessage = (msg) => ({
  id: msg.id,
  conversation_id: msg.conversation_id,
  sender_id: msg.sender_id,
  message: msg.message,
  is_read: msg.is_read,
  created_at: msg.created_at,
});

const canAccessConversation = (conversation, userId, role) => {
  if (role === 'admin') return true;
  return conversation.customer_id === userId || conversation.technician_id === userId;
};

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, { attributes: ['id', 'name', 'role'] });
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user.id);
    socket.join(`user_${userId}`);
    socket.join(`role_${socket.user.role}`);

    socket.on('conversation:join', async ({ conversationId }) => {
      const id = Number(conversationId);
      if (!id) return;
      const conversation = await Conversation.findByPk(id);
      if (!conversation) return;
      if (!canAccessConversation(conversation, socket.user.id, socket.user.role)) return;
      socket.join(`conversation_${id}`);
    });

    socket.on('conversation:typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('conversation:typing', {
        conversation_id: Number(conversationId),
        user_id: socket.user.id,
        name: socket.user.name,
      });
    });

    socket.on('conversation:stop-typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('conversation:stop-typing', {
        conversation_id: Number(conversationId),
        user_id: socket.user.id,
      });
    });

    socket.on('conversation:send', async ({ conversationId, message }) => {
      try {
        const id = Number(conversationId);
        const text = String(message || '').trim();
        if (!id || !text) return;

        const conversation = await Conversation.findByPk(id);
        if (!conversation) return;
        if (!canAccessConversation(conversation, socket.user.id, socket.user.role)) return;

        const created = await Message.create({
          conversation_id: id,
          sender_id: socket.user.id,
          message: text,
          is_read: false,
          read_at: null,
        });

        conversation.last_message_at = new Date();
        await conversation.save();

        const payload = serializeMessage(created);
        io.to(`conversation_${id}`).emit('chat:message', payload);
      } catch (error) {
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => ioInstance;

module.exports = {
  initSocket,
  getIO,
};

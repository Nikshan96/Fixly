import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (!token) return null;
  if (socket?.connected) return socket;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
  socket.on('connect_error', (e) => console.error('Socket error:', e.message));
  return socket;
};

export const getSocket  = () => socket;
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };

export const joinConversation = (conversationId) =>
  socket?.emit('conversation:join', { conversationId });

export const sendSocketMessage = (conversationId, message) =>
  socket?.emit('conversation:send', { conversationId, message });

export const emitTyping = (conversationId) =>
  socket?.emit('conversation:typing', { conversationId });

export const emitStopTyping = (conversationId) =>
  socket?.emit('conversation:stop-typing', { conversationId });

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAdminRequest = requestUrl.includes('/admin/');
    const isAuthRequest = requestUrl.includes('/auth/');

    if (!isAuthRequest && (status === 401 || (status === 403 && isAdminRequest))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-changed'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  getCurrentUser: () => api.get('/auth/me'),
};

// ─── Customer ─────────────────────────────────────────────────────────────────
export const customerAPI = {
  // Services
  getServices: () => api.get('/customer/services'),

  // Bookings
  createBooking: (data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    return api.post('/customer/bookings', data, config);
  },
  getMyBookings: () => api.get('/customer/bookings'),
  getMyPaymentHistory: () => api.get('/customer/payments'),
  cancelBooking: (id) => api.put(`/customer/bookings/${id}/cancel`),

  // Profile
  updateProfile: (data) =>
    api.put('/customer/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => api.put('/customer/change-password', data),

  // Notifications
  getNotifications: (limit = 20) =>
    api.get('/customer/notifications', { params: { limit, t: Date.now() } }),
  markNotificationRead: (id) => api.put(`/customer/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/customer/notifications/read-all'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  updateProfile: (data) =>
    api.put('/admin/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) => api.put('/admin/change-password', data),
  getNotifications: (limit = 20) =>
    api.get('/admin/notifications', { params: { limit } }),
  markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/admin/notifications/read-all'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAllTechnicians: () => api.get('/admin/technicians'),
  getTechniciansByService: (serviceId) =>
    api.get(`/admin/technicians/service/${serviceId}`),
  createTechnician: (data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    return api.post('/admin/technicians', data, config);
  },
  updateTechnicianStatus: (id, status) =>
    api.put(`/admin/technicians/${id}/status`, status),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, status) =>
    api.put(`/admin/bookings/${id}/status`, status),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  getAllServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  getRevenueStats: () => api.get('/admin/revenue'),
  getMonthlyRevenue: (params) => api.get('/admin/revenue/monthly', { params }),
  getFinanceOverview: (params) => api.get('/admin/finance/overview', { params }),
  getPaymentHistory: (params) => api.get('/admin/payments', { params }),
  getPayoutSettlements: (params) => api.get('/admin/payout-settlements', { params }),
  markPayoutSettled: (data) => api.post('/admin/payout-settlements/settle', data),
  getAllReviews: () => api.get('/admin/reviews'),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

// ─── Technician ───────────────────────────────────────────────────────────────
export const technicianAPI = {
  getDashboard: () => api.get('/technician/dashboard'),
  getAvailableJobs: () => api.get('/technician/jobs/available'),
  getMyJobs: () => api.get('/technician/jobs/my'),
  getCompletedJobs: () => api.get('/technician/jobs/completed'),
  getClosedJobs: () => api.get('/technician/jobs/closed'),
  getEarnings: () => api.get('/technician/earnings'),
  acceptJob: (id) => api.post(`/technician/jobs/${id}/accept`),
  startJob: (id) => api.post(`/technician/jobs/${id}/start`),
  completeJob: (id) => api.post(`/technician/jobs/${id}/complete`),
  getProfile: () => api.get('/technician/profile'),
  updateProfile: (data) => api.put('/technician/profile', data),
  changePassword: (data) => api.put('/technician/change-password', data),
  getNotifications: (limit = 20) => api.get('/technician/notifications', { params: { limit } }),
  markNotificationRead: (id) => api.put(`/technician/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/technician/notifications/read-all'),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversationMessages: (id) => api.get(`/messages/conversations/${id}/messages`),
  sendMessage: (id, message) => api.post(`/messages/conversations/${id}/messages`, { message }),
  getSupportTechnicians: () => api.get('/messages/support/technicians'),
  getSupportConversations: () => api.get('/messages/support/conversations'),
  createSupportConversation: (technicianId) => api.post(`/messages/support/conversations/${technicianId}`),
  getSupportConversationMessages: (id) => api.get(`/messages/support/conversations/${id}/messages`),
  sendSupportMessage: (id, message) => api.post(`/messages/support/conversations/${id}/messages`, { message }),
};

export const paymentAPI = {
  getPaymentForBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  prepareBookingPayment: (bookingId) => api.post(`/payments/booking/${bookingId}/prepare`),
  initiateEsewa: (bookingId) => api.post('/payments/esewa/initiate', { bookingId }),
  verifyEsewa: (payload) => api.post('/payments/esewa/verify', payload),
  initiateKhalti: (bookingId) => api.post('/payments/khalti/initiate', { bookingId }),
  verifyKhalti: (payload) => api.post('/payments/khalti/verify', payload),
};

export default api;

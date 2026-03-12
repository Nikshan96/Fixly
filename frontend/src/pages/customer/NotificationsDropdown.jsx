// frontend/src/components/customer/NotificationsDropdown.jsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, CheckCircle, XCircle, User, Lock, Briefcase, Clock } from 'lucide-react';
import { customerAPI } from '../../services/api';
import { getSocket } from '../../services/socket';

const getNotificationIcon = (type) => {
  const map = {
    booking_confirmed: CheckCircle,
    technician_assigned: User,
    technician_on_the_way: Briefcase,
    job_started: Briefcase,
    job_completed: CheckCircle,
    booking_cancelled: XCircle,
    booking_rescheduled: Clock,
    payment_received: CheckCircle,
    support_ticket: Bell,
    new_review_reminder: Check,
    profile_updated: User,
    password_changed: Lock,
    welcome: Bell,
  };
  return map[type] || Bell;
};

const getIconColors = (color) => {
  const map = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return map[color] || 'bg-blue-100 text-blue-600';
};

const formatTime = (createdAt) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(createdAt).toLocaleDateString();
};

const NotificationsDropdown = () => {
  const navigate = useNavigate();
  const FAST_POLL_MS = 3000;
  const SLOW_POLL_MS = 10000;
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!silent) setLoading(true);
      const response = await customerAPI.getNotifications(20);
      if (response.data.success) {
        const notifs = response.data.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (!silent) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const getPollDelay = () => (document.visibilityState === 'visible' ? FAST_POLL_MS : SLOW_POLL_MS);

    fetchNotifications();
    let interval = setInterval(() => fetchNotifications(true), getPollDelay());

    const handleVisibilityChange = () => {
      fetchNotifications(true);
      clearInterval(interval);
      interval = setInterval(() => fetchNotifications(true), getPollDelay());
    };

    const handleOnline = () => fetchNotifications(true);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = () => {
      fetchNotifications(true);
    };

    socket.on('notification:new', onNotification);
    return () => socket.off('notification:new', onNotification);
  }, []);

  useEffect(() => {
    const handleWindowFocus = () => fetchNotifications(true);
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  const markAsRead = async (id) => {
    try {
      await customerAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif?.is_read) {
      await markAsRead(notif.id);
    }

    const link = notif?.link;
    if (link) {
      navigate(link);
      setIsOpen(false);
      return;
    }

    if (notif?.type === 'support_ticket') {
      navigate('/my-bookings');
      setIsOpen(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await customerAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={22} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-gray-800 font-bold text-base">Notifications</h3>
              <p className="text-gray-400 text-xs">{unreadCount} unread</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-50 flex gap-3">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            </div>
          )}

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="p-8 text-center">
                <Bell size={40} className="mx-auto text-gray-200 mb-2 animate-pulse" />
                <p className="text-gray-400 text-sm">Loading...</p>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-8 text-center">
                <Bell size={40} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  You'll be notified about your bookings here
                </p>
              </div>
            )}

            {!loading && notifications.map((notif) => {
              const Icon = getNotificationIcon(notif.type);
              const iconColor = getIconColors(notif.color || 'blue');
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition border-b border-gray-50 last:border-0 ${
                    !notif.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                      <Icon size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-800 font-semibold text-sm">{notif.title}</p>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
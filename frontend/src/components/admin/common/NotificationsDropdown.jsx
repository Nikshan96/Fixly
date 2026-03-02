import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCircle, AlertCircle, Users, Briefcase, DollarSign, Lock, User, XCircle, Shuffle } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import { getSocket } from '../../../services/socket';

const NotificationsDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const getNotificationIcon = (type) => {
    const iconMap = {
      profile_updated: User,
      password_changed: Lock,
      job_created: Briefcase,
      job_accepted: CheckCircle,
      job_in_progress: Briefcase,
      job_completed: CheckCircle,
      job_cancelled: XCircle,
      job_reassigned: Shuffle,
      technician_hired: Users,
      technician_activated: CheckCircle,
      technician_deactivated: AlertCircle,
      payment_received: DollarSign,
      payment_failed: AlertCircle,
      new_review: CheckCircle,
      support_ticket: Bell,
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      profile_updated: 'green',
      password_changed: 'yellow',
      job_created: 'blue',
      job_accepted: 'green',
      job_in_progress: 'blue',
      job_completed: 'green',
      job_cancelled: 'red',
      job_reassigned: 'blue',
      technician_hired: 'green',
      technician_activated: 'green',
      technician_deactivated: 'red',
      payment_received: 'green',
      payment_failed: 'red',
      new_review: 'yellow',
      support_ticket: 'blue',
    };
    return colorMap[type] || 'blue';
  };

  const formatTime = (createdAt) => {
    const notifDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return notifDate.toLocaleDateString();
  };

  const fetchNotifications = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!silent) setLoading(true);
      const response = await adminAPI.getNotifications(20);
      
      if (response.data.success) {
        const notifs = response.data.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      if (!silent) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Fast fallback refresh; socket still handles near-instant updates.
    const interval = setInterval(() => fetchNotifications(true), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = () => fetchNotifications(true);
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
      await adminAPI.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif) return;

    if (!notif.is_read) {
      await markAsRead(notif.id);
    }

    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsOpen(false);
  };

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-400 bg-blue-500/20',
      green: 'text-green-400 bg-green-500/20',
      purple: 'text-blue-400 bg-blue-500/20',
      orange: 'text-amber-300 bg-amber-500/20',
      red: 'text-red-400 bg-red-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/20'
    };
    return colors[color] || colors.blue;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notifications-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative notifications-dropdown">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-gray-800 font-bold text-lg">Notifications</h3>
                <p className="text-gray-700 text-sm font-medium">{unreadCount} unread</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-200 flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
                <span className="text-gray-600">•</span>
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="p-8 text-center">
                  <Bell size={48} className="mx-auto text-gray-300 mb-3 animate-pulse" />
                  <p className="text-gray-700 text-sm font-medium">Loading...</p>
                </div>
              )}
              
              {!loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-700 text-sm font-medium">No notifications</p>
                  <p className="text-gray-600 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => {
                    const Icon = getNotificationIcon(notif.type);
                    const color = getNotificationColor(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notif.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(color)}`}>
                            <Icon size={20} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-gray-800 font-medium text-sm">{notif.title}</h4>
                              {!notif.is_read && (
                                <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mt-1">{notif.message}</p>
                            <p className="text-gray-700 text-sm mt-2">{formatTime(notif.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button 
                  onClick={async () => {
                    await fetchNotifications();
                    setIsOpen(false);
                  }}
                  disabled={loading}
                  className="text-blue-700 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Notifications'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;

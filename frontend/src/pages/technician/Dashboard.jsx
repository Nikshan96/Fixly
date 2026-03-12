import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  CalendarDays,
  DollarSign,
  ChevronRight,
  ClipboardList,
  Clock3,
  Home,
  LogOut,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  Play,
  Send,
  User,
  Wallet,
  Wrench,
  AlertCircle,
  BadgeCheck,
  CircleDollarSign,
  Map,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { messagesAPI, technicianAPI } from '../../services/api';
import { getSocket, joinConversation } from '../../services/socket';

const tabs = ['jobs', 'chat', 'earnings', 'profile'];

const progressSteps = ['pending', 'accepted', 'in-progress', 'completed'];

const getSafeUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const mapEmbedUrl = (location = '') =>
  `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

const mapTrackUrl = (location = '') =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

const formatNpr = (amount) => `Rs ${Number(amount || 0).toFixed(2)}`;

const formatDateLabel = (bookingDate, bookingTime) => {
  const raw = `${bookingDate || ''} ${bookingTime || ''}`.trim();
  if (!raw) return 'Schedule not available';

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toDateLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const getStatusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'in-progress') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s === 'accepted') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (s === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (s === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const getProgressIndex = (status) => {
  const s = String(status || '').toLowerCase();
  const idx = progressSteps.indexOf(s);
  return idx === -1 ? 0 : idx;
};

const toTitle = (value) =>
  String(value || '')
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');

const TechnicianDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobCategory, setJobCategory] = useState('available');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [expandedMapIds, setExpandedMapIds] = useState({});
  const [acceptedJob, setAcceptedJob] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingConversationMessages, setLoadingConversationMessages] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [dashboard, setDashboard] = useState({
    availableJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingPayout: 0,
  });
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [closedJobs, setClosedJobs] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, monthly: [] });
  const [notifications, setNotifications] = useState([]);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    hourly_rate: '',
    experience_years: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const bellRef = useRef(null);
  const profileMenuRef = useRef(null);
  const user = useMemo(getSafeUser, []);
  const userId = Number(user?.id || 0);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const unreadCount = useMemo(
    () => (notifications || []).filter((item) => !item.is_read).length,
    [notifications]
  );

  const toggleMap = (jobId) => {
    setExpandedMapIds((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        dashRes,
        availableRes,
        myRes,
        completedRes,
        closedRes,
        earningsRes,
        profileRes,
        notificationsRes,
      ] = await Promise.all([
        technicianAPI.getDashboard(),
        technicianAPI.getAvailableJobs(),
        technicianAPI.getMyJobs(),
        technicianAPI.getCompletedJobs(),
        technicianAPI.getClosedJobs(),
        technicianAPI.getEarnings(),
        technicianAPI.getProfile(),
        technicianAPI.getNotifications(),
      ]);

      setDashboard(
        dashRes.data?.data || {
          availableJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          pendingPayout: 0,
        }
      );
      setAvailableJobs(availableRes.data?.data || []);
      setMyJobs(myRes.data?.data || []);
      setCompletedJobs(completedRes.data?.data || []);
      setClosedJobs(closedRes.data?.data || []);
      setEarnings(earningsRes.data?.data || { total: 0, monthly: [] });
      setNotifications(notificationsRes.data?.data || []);

      const p = profileRes.data?.data || {};
      setProfile({
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        address: p.address || '',
        hourly_rate: p.hourly_rate ?? '',
        experience_years: p.experience_years ?? '',
        bank_name: p.bank_name || '',
        account_number: p.account_number || '',
        account_holder_name: p.account_holder_name || '',
      });
    } catch (error) {
      console.error('Technician dashboard load error:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (preferredBookingId = null) => {
    try {
      setLoadingConversations(true);
      const response = await messagesAPI.getConversations();
      const list = response.data?.data || [];
      setConversations(list);

      if (preferredBookingId) {
        const preferred = list.find((item) => item.booking?.id === preferredBookingId || item.booking_id === preferredBookingId);
        if (preferred) {
          setSelectedConversationId(preferred.id);
          return list;
        }
      }

      if (!selectedConversationId && list.length > 0) {
        setSelectedConversationId(list[0].id);
      }

      return list;
    } catch (error) {
      console.error('Load technician conversations error:', error);
      toast.error(error.response?.data?.message || 'Failed to load conversations');
      return [];
    } finally {
      setLoadingConversations(false);
    }
  };

  const openChatFromNotificationLink = async (link) => {
    if (!link) return;

    const query = link.includes('?') ? link.slice(link.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    const tab = params.get('tab');
    const conversationId = Number(params.get('conversationId') || 0);
    const bookingId = Number(params.get('bookingId') || 0);

    if (tab === 'chat') {
      setActiveTab('chat');
    }

    const list = await loadConversations(bookingId || null);
    if (conversationId) {
      const found = list.find((item) => Number(item.id) === conversationId);
      if (found) {
        setSelectedConversationId(found.id);
      }
    }
  };

  const loadConversationMessages = async (conversationId) => {
    if (!conversationId) {
      setConversationMessages([]);
      return;
    }

    try {
      setLoadingConversationMessages(true);
      const response = await messagesAPI.getConversationMessages(conversationId);
      setConversationMessages(response.data?.data?.messages || []);
      setConversations((prev) =>
        prev.map((item) => (item.id === conversationId ? { ...item, unread_count: 0 } : item))
      );
    } catch (error) {
      console.error('Load technician conversation messages error:', error);
      toast.error(error.response?.data?.message || 'Failed to load chat messages');
    } finally {
      setLoadingConversationMessages(false);
    }
  };

  useEffect(() => {
    loadData();
    loadConversations();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'chat') {
      setActiveTab('chat');
    }

    const conversationId = Number(params.get('conversationId') || 0);
    const bookingId = Number(params.get('bookingId') || 0);
    if (conversationId || bookingId) {
      openChatFromNotificationLink(location.search);
    }
  }, [location.search]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsBellOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    loadConversationMessages(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    joinConversation(selectedConversationId);

    const socket = getSocket();
    if (!socket) return;

    const onMessage = (payload) => {
      if (payload.conversation_id !== selectedConversationId) return;
      setConversationMessages((prev) => [...prev, payload]);
      setConversations((prev) =>
        prev.map((item) =>
          item.id === selectedConversationId ? { ...item, last_message: payload } : item
        )
      );
    };

    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [selectedConversationId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = async () => {
      try {
        const response = await technicianAPI.getNotifications(20);
        if (response.data?.success) {
          setNotifications(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to refresh technician notifications:', error);
      }
    };

    socket.on('notification:new', onNotification);
    return () => socket.off('notification:new', onNotification);
  }, []);

  const handleAccept = async (bookingId) => {
    try {
      const response = await technicianAPI.acceptJob(bookingId);
      const accepted = response.data?.data || null;
      setAcceptedJob(accepted);
      setActiveTab('jobs');
      await loadData();
      await loadConversations(accepted?.id || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept job');
    }
  };

  const handleStart = async (bookingId) => {
    try {
      await technicianAPI.startJob(bookingId);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start job');
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await technicianAPI.completeJob(bookingId);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete job');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await technicianAPI.markNotificationRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notification');
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item) return;
    if (!item.is_read && item.id) {
      await handleMarkRead(item.id);
    }

    if (item.link) {
      await openChatFromNotificationLink(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await technicianAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notifications');
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      await technicianAPI.updateProfile({
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        hourly_rate: profile.hourly_rate,
        experience_years: profile.experience_years,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        account_holder_name: profile.account_holder_name,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordField = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    if (changingPassword) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await technicianAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleLogoClick = async () => {
    setActiveTab('jobs');
    setJobCategory('available');
    setExpandedMapIds({});
    await loadData();
    navigate('/technician/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!selectedConversationId || !replyText.trim()) return;
    try {
      await messagesAPI.sendMessage(selectedConversationId, replyText.trim());
      setReplyText('');
      await loadConversationMessages(selectedConversationId);
      await loadConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const jobFilters = [
    { key: 'available', label: 'Available', count: availableJobs.length },
    { key: 'active', label: 'Accepted/In Progress', count: myJobs.length },
    { key: 'completed', label: 'Completed', count: completedJobs.length },
    { key: 'cancelled', label: 'Cancelled/Closed', count: closedJobs.length },
  ];

  const activeJobsList =
    jobCategory === 'available'
      ? availableJobs
      : jobCategory === 'active'
      ? myJobs
      : jobCategory === 'completed'
      ? completedJobs
      : closedJobs;

  const activeJobsTitle =
    jobCategory === 'available'
      ? 'Available Jobs'
      : jobCategory === 'active'
      ? 'My Active Jobs'
      : jobCategory === 'completed'
      ? 'Completed Jobs'
      : 'Cancelled / Closed Jobs';

  const activeJobsSubtitle =
    jobCategory === 'available'
      ? 'Accept new requests from customers'
      : jobCategory === 'active'
      ? 'Accepted and in-progress assignments'
      : jobCategory === 'completed'
      ? 'Completed work history'
      : 'Jobs that were cancelled or closed';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-gray-50 to-gray-100 pb-24">
      <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleLogoClick} className="flex items-center gap-3">
              <img src="/fixly-logo.jpeg" alt="Fixly" className="h-10 w-10 rounded-lg object-contain shadow-sm" />
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Fixly</h1>
                <p className="text-sm text-gray-600">Hi {user?.name || 'Technician'} - Ready for today&apos;s jobs?</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => setIsBellOpen((prev) => !prev)}
                className="relative rounded-xl border border-blue-100 bg-white p-2.5 text-blue-600 shadow-sm transition hover:bg-blue-50"
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-600 px-1.5 text-center text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>

              {isBellOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 8).map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            item.is_read
                              ? 'border-gray-200 bg-white hover:bg-gray-50'
                              : 'border-blue-100 bg-blue-50 hover:bg-blue-100/60'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                          <p className="mt-1 text-xs text-gray-600">{item.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2 py-1.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {(user?.name || 'T').charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-gray-800 sm:inline">
                  {user?.name || 'Technician'}
                </span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50"
                  >
                    <User size={15} />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('earnings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50"
                  >
                    <DollarSign size={15} />
                    Earnings
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Briefcase size={18} />} label="Available Jobs" value={dashboard.availableJobs} />
          <StatCard icon={<Clock3 size={18} />} label="Active Jobs" value={dashboard.activeJobs} />
          <StatCard icon={<CheckCircle2 size={18} />} label="Completed" value={dashboard.completedJobs} />
          <StatCard icon={<Wallet size={18} />} label="Pending Payout" value={formatNpr(dashboard.pendingPayout)} />
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_12px_30px_-20px_rgba(37,99,235,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                <Sparkles size={13} />
                Today Focus
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Keep response time low, accept quality leads quickly, and keep customers updated via chat.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <BadgeCheck size={14} />
              Technician Mode Active
            </div>
          </div>
        </section>

        {activeTab === 'jobs' ? (
          <section className="space-y-6">
            <Panel title="Job Categories" subtitle="Filter technician jobs like customer booking sections">
              <div className="flex flex-wrap gap-2">
                {jobFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setJobCategory(filter.key)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      jobCategory === filter.key
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        jobCategory === filter.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title={activeJobsTitle} subtitle={activeJobsSubtitle}>
              {loading ? <LoadingRows /> : null}
              {!loading && activeJobsList.length === 0 ? (
                <EmptyState message={`No ${jobCategory} jobs found.`} />
              ) : null}

              <div className="space-y-4">
                {activeJobsList.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    expanded={Boolean(expandedMapIds[job.id])}
                    onToggleMap={() => toggleMap(job.id)}
                    actionLabel={
                      jobCategory === 'available'
                        ? 'Accept'
                        : jobCategory === 'active'
                        ? job.status === 'accepted'
                          ? 'Start'
                          : 'Complete'
                        : undefined
                    }
                    actionIcon={
                      jobCategory === 'available'
                        ? <Check size={14} />
                        : jobCategory === 'active'
                        ? job.status === 'accepted'
                          ? <Play size={14} />
                          : <CheckCircle2 size={14} />
                        : undefined
                    }
                    onAction={
                      jobCategory === 'available'
                        ? () => handleAccept(job.id)
                        : jobCategory === 'active'
                        ? () => (job.status === 'accepted' ? handleStart(job.id) : handleComplete(job.id))
                        : undefined
                    }
                  />
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === 'chat' ? (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.3fr]">
            <Panel title="Conversations" subtitle="Chat with customer and admin on assigned jobs">
              {loadingConversations ? <LoadingRows /> : null}
              {!loadingConversations && conversations.length === 0 ? (
                <EmptyState message="No conversations yet. Accept a job to start chatting." />
              ) : null}
              <div className="space-y-2">
                {conversations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedConversationId(item.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedConversationId === item.id
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Booking #{item.booking?.id || item.booking_id || '-'}</p>
                        <p className="text-xs text-gray-600">
                          {item.customer?.name || 'Customer'} ↔ {item.technician?.name || 'Technician'}
                        </p>
                      </div>
                      {item.unread_count > 0 ? (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {item.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">{item.last_message?.message || 'No messages yet'}</p>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel
              title={selectedConversation ? `Booking #${selectedConversation.booking?.id || selectedConversation.booking_id}` : 'Chat'}
              subtitle={selectedConversation ? 'Real-time conversation thread' : 'Select a conversation to view messages'}
            >
              {!selectedConversation ? <EmptyState message="Choose a conversation from the left panel." /> : null}
              {selectedConversation ? (
                <>
                  <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
                    {loadingConversationMessages ? (
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    ) : null}
                    {!loadingConversationMessages && conversationMessages.length === 0 ? (
                      <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
                    ) : null}
                    {conversationMessages.map((msg) => {
                      const mine = Number(msg.sender_id) === userId;
                      return (
                        <div key={msg.id || `${msg.sender_id}-${msg.created_at}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm ${
                              mine
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-200 bg-white text-gray-800'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <p className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                              {toDateLabel(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSendReply();
                      }}
                      placeholder="Type your message..."
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Send size={15} />
                      Send
                    </button>
                  </div>
                </>
              ) : null}
            </Panel>
          </section>
        ) : null}

        {activeTab === 'earnings' ? (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Panel title="Earnings Summary" subtitle="Your payout overview">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-md">
                <p className="text-sm text-white/90">Total Earnings</p>
                <p className="mt-1 text-3xl font-bold">{formatNpr(earnings.total)}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<CircleDollarSign size={16} />}
                  label="This Month"
                  value={
                    earnings.monthly?.length
                      ? formatNpr(earnings.monthly[earnings.monthly.length - 1]?.amount || 0)
                      : formatNpr(0)
                  }
                />
                <MetricCard icon={<CalendarDays size={16} />} label="Active Months" value={earnings.monthly?.length || 0} />
              </div>
              <div className="mt-4 space-y-3">
                {(earnings.monthly || []).length === 0 ? (
                  <EmptyState message="No earnings data yet." />
                ) : (
                  earnings.monthly.map((item) => (
                    <div
                      key={`${item.month}-${item.year}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
                    >
                      <p className="text-sm font-semibold text-gray-700">
                        {item.month} {item.year}
                      </p>
                      <p className="text-sm font-bold text-blue-700">{formatNpr(item.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="Performance" subtitle="How your work is progressing">
              <div className="space-y-4">
                <MetricRow label="Completed Jobs" value={dashboard.completedJobs} />
                <MetricRow label="Active Jobs" value={dashboard.activeJobs} />
                <MetricRow label="Available Jobs" value={dashboard.availableJobs} />
              </div>
            </Panel>
          </section>
        ) : null}

        {activeTab === 'profile' ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <Panel title="Profile Details" subtitle="Update your account information">
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Public Technician Snapshot</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{profile.name || 'Technician'}</p>
                <p className="text-xs text-gray-600">{profile.phone || 'No phone'} • {profile.address || 'No address set'}</p>
              </div>
              <form onSubmit={handleProfileSave} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField label="Full Name" name="name" value={profile.name} onChange={handleProfileChange} />
                <InputField label="Email" name="email" value={profile.email} onChange={handleProfileChange} disabled />
                <InputField label="Phone" name="phone" value={profile.phone} onChange={handleProfileChange} />
                <InputField label="Address" name="address" value={profile.address} onChange={handleProfileChange} />
                <InputField label="Hourly Rate" name="hourly_rate" value={profile.hourly_rate} onChange={handleProfileChange} />
                <InputField
                  label="Experience Years"
                  name="experience_years"
                  value={profile.experience_years}
                  onChange={handleProfileChange}
                />
                <InputField label="Bank Name" name="bank_name" value={profile.bank_name} onChange={handleProfileChange} />
                <InputField
                  label="Account Number"
                  name="account_number"
                  value={profile.account_number}
                  onChange={handleProfileChange}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Account Holder Name"
                    name="account_holder_name"
                    value={profile.account_holder_name}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </Panel>

            <Panel title="Change Password" subtitle="Update your login password securely">
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <InputField
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordField}
                />
                <InputField
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordField}
                />
                <InputField
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordField}
                />
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-70"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </Panel>
          </section>
        ) : null}

      </main>

      {acceptedJob ? (
        <AcceptedJobModal
          job={acceptedJob}
          onClose={() => setAcceptedJob(null)}
          onOpenChat={() => {
            setActiveTab('chat');
            setAcceptedJob(null);
          }}
        />
      ) : null}

      <BottomTabBar activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

const Panel = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.5)] transition hover:shadow-[0_18px_40px_-24px_rgba(37,99,235,0.32)]">
    <div className="mb-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
    {children}
  </section>
);

const StatCard = ({ icon, label, value }) => (
  <article className="rounded-2xl border border-blue-100/80 bg-gradient-to-b from-white to-blue-50/40 p-4 shadow-[0_14px_28px_-22px_rgba(37,99,235,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgba(37,99,235,0.5)]">
    <div className="mb-2 flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">{icon}</span>
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </article>
);

const MetricCard = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-3">
    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {icon}
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
  </div>
);

const MetricRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
    <p className="text-sm font-semibold text-gray-700">{label}</p>
    <p className="text-base font-bold text-blue-700">{value}</p>
  </div>
);

const LoadingRows = () => (
  <div className="space-y-3">
    {[1, 2].map((item) => (
      <div key={item} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    ))}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-blue-50/50 p-7 text-center">
    <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
      <Sparkles size={16} />
    </div>
    <p className="text-sm font-semibold text-gray-700">{message}</p>
    <p className="mt-1 text-xs text-gray-500">New activity will show up here automatically.</p>
  </div>
);

const InputField = ({ label, ...props }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-semibold text-gray-700">{label}</span>
    <input
      {...props}
      className={`rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
        props.disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
      }`}
    />
  </label>
);

const JobProgressTrack = ({ status }) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'cancelled') {
    return (
      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
        This job was cancelled.
      </div>
    );
  }

  const currentIdx = getProgressIndex(normalized);
  const progressPercent = (currentIdx / (progressSteps.length - 1)) * 100;

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
        <AlertCircle size={14} />
        Job Progress
      </div>

      <div className="relative px-2">
        <div className="absolute left-3 right-3 top-4 h-1 rounded-full bg-gray-200" />
        <div
          className="absolute left-3 top-4 h-1 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `calc((100% - 1.5rem) * ${progressPercent / 100})` }}
        />
        <div className="relative grid grid-cols-4">
          {progressSteps.map((step, index) => {
            const done = index < currentIdx;
            const current = index === currentIdx;
            return (
              <div key={step} className="flex justify-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    done
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : current
                      ? 'border-blue-600 bg-white ring-2 ring-blue-100'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  {done ? (
                    <Check size={14} />
                  ) : current ? (
                    <div className="h-3 w-3 rounded-full bg-blue-600" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 px-2">
        {progressSteps.map((step, index) => {
          const current = index === currentIdx;
          const done = index < currentIdx;
          return (
            <div
              key={step}
              className={`text-center text-[10px] font-semibold ${
                current ? 'text-blue-700' : done ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {toTitle(step)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const JobCard = ({ job, actionLabel, actionIcon, onAction, onToggleMap, expanded }) => {
  const location = job.location || 'Location not provided';
  const serviceIcon = job.service?.icon;
  const jobStatus = String(job.status || 'pending').toLowerCase();
  const customerPhone = job.customer?.phone || 'Not available';
  const description = (job.description || '').trim();
  const snippet = description.length > 120 ? `${description.slice(0, 117)}...` : description;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_14px_32px_-24px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_-24px_rgba(37,99,235,0.35)]">
      <div className="border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              {serviceIcon ? <span className="text-lg leading-none">{serviceIcon}</span> : <Wrench size={18} />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{job.service?.name || 'Service Request'}</p>
              <p className="text-sm text-gray-600">{job.customer?.name || 'Customer'}</p>
            </div>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(jobStatus)}`}>
            {toTitle(jobStatus)}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <MapPin size={16} className="mt-0.5 text-blue-600" />
            <p>{location}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <CalendarDays size={16} className="text-blue-600" />
            <p>{formatDateLabel(job.booking_date, job.booking_time)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <Phone size={16} className="text-blue-600" />
            <p>{customerPhone}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <Map size={16} className="text-blue-600" />
            <p className="truncate">Open map for live navigation</p>
          </div>
        </div>

        {snippet ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Service Details</p>
            <p className="mt-1 text-sm text-gray-700">{snippet}</p>
          </div>
        ) : null}

        <div className="hidden items-start gap-2 text-sm text-gray-700">
          <MapPin size={16} className="mt-0.5 text-blue-600" />
          <p>{location}</p>
        </div>
        <div className="hidden items-center gap-2 text-sm text-gray-700">
          <CalendarDays size={16} className="text-blue-600" />
          <p>{formatDateLabel(job.booking_date, job.booking_time)}</p>
        </div>

        <JobProgressTrack status={jobStatus} />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              {actionIcon}
              {actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleMap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            <MapPinned size={14} />
            {expanded ? 'Hide Map' : 'Track Location'}
          </button>
          <a
            href={mapTrackUrl(location)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Open Live Map
            <ChevronRight size={13} />
          </a>
        </div>

        {expanded ? (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <iframe
              title={`Map for job ${job.id}`}
              src={mapEmbedUrl(location)}
              className="h-52 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default TechnicianDashboard;

const AcceptedJobModal = ({ job, onClose, onOpenChat }) => {
  const customerName = job?.customer?.name || 'Customer';
  const phone = job?.customer?.phone || 'Not available';
  const address = job?.customer?.address || job?.location || 'Not available';
  const serviceDetails = job?.description || job?.service?.name || 'Service details not available';
  const when = formatDateLabel(job?.booking_date, job?.booking_time);
  const budget = job?.total_amount ? formatNpr(job.total_amount) : 'Not fixed';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl sm:p-5">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/90">Success</p>
          <p className="text-base font-bold sm:text-lg">You accepted! Customer details unlocked</p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <DetailCard icon={<User size={15} />} label="Customer Name" value={customerName} />
          <DetailCard icon={<Phone size={15} />} label="Phone Number" value={phone} />
          <DetailCard icon={<Home size={15} />} label="Full Address" value={address} span="sm:col-span-2" />
          <DetailCard icon={<ClipboardList size={15} />} label="Service Details" value={serviceDetails} span="sm:col-span-2" />
          <DetailCard icon={<CalendarDays size={15} />} label="Date & Time" value={when} />
          <DetailCard icon={<Wallet size={15} />} label="Budget" value={budget} />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a
            href={mapTrackUrl(job?.location || address)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            <MapPinned size={14} />
            Get Directions
          </a>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
          >
            <Phone size={14} />
            Call Customer
          </a>
          <button
            type="button"
            onClick={onOpenChat}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <MessageCircle size={14} />
            Open Chat
          </button>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({ icon, label, value, span = '' }) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-2.5 ${span}`}>
    <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {icon}
      {label}
    </p>
    <p className="text-sm font-semibold text-gray-800">{value}</p>
  </div>
);

const BottomTabBar = ({ activeTab, onChangeTab }) => {
  const navItems = [
    { key: 'jobs', label: 'Jobs', icon: Briefcase },
    { key: 'chat', label: 'Chat', icon: MessageCircle },
    { key: 'earnings', label: 'Earnings', icon: Wallet },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-4">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangeTab(item.key)}
              className={`flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold transition ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <ActiveIcon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

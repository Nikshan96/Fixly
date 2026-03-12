import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { customerAPI, messagesAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageHelper';
import BookingModal from '../../components/customer/BookingModal';
import { getSocket, joinConversation } from '../../services/socket';
import {
  MapPin, Calendar, Clock, Phone, User, MessageCircle,
  XCircle, RefreshCw, AlertCircle, Search, RotateCcw,
  Wallet, ShieldCheck, CreditCard,
} from 'lucide-react';
 
const statusConfig = {
  pending:     { label: 'Pending',     bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  accepted:    { label: 'Accepted',    bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  'in-progress':{ label: 'In Progress',bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  completed:   { label: 'Completed',   bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200',  dot: 'bg-green-500'  },
  cancelled:   { label: 'Canceled',    bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200',    dot: 'bg-red-500'    },
};
 
const statusSteps = [
  { key: 'pending',      label: 'Pending'     },
  { key: 'accepted',     label: 'Accepted'    },
  { key: 'in-progress',  label: 'In Progress' },
  { key: 'completed',    label: 'Completed'   },
];

const normalizeStatus = (status) => {
  const raw = String(status || '').toLowerCase().trim();
  if (['pending'].includes(raw)) return 'pending';
  if (['accepted'].includes(raw)) return 'accepted';
  if (['in-progress', 'in_progress', 'in progress', 'inprogress'].includes(raw)) return 'in-progress';
  if (['completed', 'complete'].includes(raw)) return 'completed';
  if (['cancelled', 'canceled'].includes(raw)) return 'cancelled';
  return 'pending';
};
 
const tabConfig = {
  active:    { title: 'Active Bookings',    matcher: (s) => ['pending','accepted','in-progress'].includes(s) },
  completed: { title: 'Completed Bookings', matcher: (s) => s === 'completed'  },
  cancelled: { title: 'Canceled Bookings',  matcher: (s) => s === 'cancelled'  },
};
 
// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const normalizedStatus = normalizeStatus(status);
  const c = statusConfig[normalizedStatus] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};
 
// ─── Progress Tracker (Fixed) ─────────────────────────────────────────────────
// Rules:
//   - Steps BEFORE current → solid blue circle with checkmark
//   - CURRENT step         → white circle with blue border + filled blue dot inside
//   - Steps AFTER current  → grey circle
//   - Connector line fills blue only between completed steps
const BookingTimeline = ({ status }) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === 'cancelled') {
    return (
      <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-2 text-sm font-semibold">
        <XCircle size={16} /> Booking canceled
      </div>
    );
  }
 
  const currentIndex = Math.max(0, statusSteps.findIndex((s) => s.key === normalizedStatus));
  const progressPercent = (currentIndex / (statusSteps.length - 1)) * 100;
 
  return (
    <div className="mt-4">
      <div className="relative px-4">
        <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-gray-200" />
        <div className="absolute left-4 top-4 h-1 rounded-full bg-blue-600 transition-all duration-500"
             style={{ width: `calc((100% - 2rem) * ${progressPercent / 100})` }} />

        <div className="relative grid grid-cols-4">
        {statusSteps.map((step, index) => {
          const isDone    = index < currentIndex;
          const isCurrent = index === currentIndex;
 
          return (
            <div key={step.key} className="flex justify-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                isDone
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : isCurrent
                  ? 'bg-white border-blue-600 shadow ring-2 ring-blue-100'
                  : 'bg-gray-100 border-gray-300'
              }`}>
                {isDone ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
 
      {/* Labels */}
      <div className="grid grid-cols-4 mt-2 px-4">
        {statusSteps.map((step, index) => {
          const isCurrent  = index === currentIndex;
          const isDone     = index < currentIndex;
          return (
            <div key={step.key} className={`text-center text-[11px] sm:text-xs font-medium ${
              isCurrent ? 'text-blue-600 font-bold' : isDone ? 'text-blue-400' : 'text-gray-400'
            }`}>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
};
const formatTime = (t) => {
  if (!t) return 'N/A';
  try { return new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true }); }
  catch { return t; }
};
 
// ─── Cancel Modal (white/blue — no purple) ────────────────────────────────────
const CancelBookingModal = ({ isOpen, isClosing, onClose, onConfirm, loading }) => (
  <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className={`relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-all duration-200 ${isOpen && !isClosing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <XCircle size={20} className="text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Cancel Booking?</h3>
          <p className="text-gray-500 text-xs">This action cannot be undone.</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">Are you sure you want to cancel this booking?</p>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
        <ShieldCheck size={14} />
        This booking will move to cancelled history.
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onConfirm} disabled={loading}
          className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-400">
          {loading ? 'Cancelling...' : 'Yes, Cancel'}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200">
          No, Keep It
        </button>
      </div>
    </div>
  </div>
);

const PaymentModal = ({ isOpen, booking, method, onMethodChange, onClose, onConfirm, loading }) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-blue-700">Pay for Booking #{booking.id}</h3>
        <p className="mt-1 text-xs text-gray-600">Choose payment method and continue to secure gateway.</p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
              <CreditCard size={13} />
              Service
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{booking.service?.name || 'Service'}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
              <Wallet size={13} />
              Amount
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-800">NPR {Number(booking.total_amount || booking.payment?.amount || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${method === 'esewa' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="esewa"
              checked={method === 'esewa'}
              onChange={() => onMethodChange('esewa')}
            />
            <span className="font-semibold text-gray-700">eSewa</span>
          </label>
          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${method === 'khalti' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="khalti"
              checked={method === 'khalti'}
              onChange={() => onMethodChange('khalti')}
            />
            <span className="font-semibold text-gray-700">Khalti</span>
          </label>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
          <ShieldCheck size={13} />
          Payment is processed on secure provider page.
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Redirecting...' : 'Proceed to Pay'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
 
// ─── Booking Card ─────────────────────────────────────────────────────────────
const BookingCard = ({ booking, cancellingId, onCancelClick, onRebookClick, onMessageClick, onPayClick }) => {
  const normalizedStatus = normalizeStatus(booking.status);
  const showTech  = ['accepted','in-progress','completed'].includes(normalizedStatus);
  const canCancel = ['pending','accepted'].includes(normalizedStatus);
  const canRebook = ['completed','cancelled'].includes(normalizedStatus);
  const paymentStatus = booking.payment?.status;
  const hasPaid = paymentStatus === 'completed';
  const canPayNow = !hasPaid && (
    normalizedStatus === 'completed' ||
    (normalizedStatus === 'in-progress' && paymentStatus === 'pending')
  );
 
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Header */}
      <div className="bg-blue-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{booking.service?.icon || '🔧'}</span>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-blue-700">{booking.service?.name || 'Service'}</h3>
            <p className="text-gray-500 text-sm">Booking #{booking.id}</p>
          </div>
        </div>
        <StatusBadge status={normalizedStatus} />
      </div>
 
      <div className="p-4 sm:p-6">
        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm"><strong>Date:</strong> {formatDate(booking.booking_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm"><strong>Time:</strong> {formatTime(booking.booking_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm"><strong>Location:</strong> {booking.location}</span>
          </div>
          {booking.total_amount && (
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-blue-500 font-bold text-sm flex-shrink-0">NPR</span>
              <span className="text-sm"><strong>Amount:</strong> {Number(booking.total_amount).toLocaleString()}</span>
            </div>
          )}
        </div>
 
        {booking.description && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-gray-600 text-sm"><strong>Description:</strong> {booking.description}</p>
          </div>
        )}
 
        {booking.photo_url && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Problem Photo</p>
            <img src={getImageUrl(booking.photo_url)} alt={`Booking ${booking.id}`}
              className="w-full max-w-sm h-44 object-cover rounded-xl border border-gray-200" loading="lazy" />
          </div>
        )}
 
        {/* Technician card — shows after accepted */}
        {showTech && booking.technician ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <h4 className="text-blue-700 font-bold text-sm mb-3 flex items-center gap-2">
              <User size={16} /> Your Technician
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                {booking.technician.profile_image
                  ? <img src={getImageUrl(booking.technician.profile_image)} alt={booking.technician.name} className="w-full h-full object-cover" />
                  : booking.technician.name?.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{booking.technician.name}</p>
                {booking.technician.phone && (
                  <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                    <Phone size={13} /> {booking.technician.phone}
                  </p>
                )}
                {/* Location instead of rating */}
                {booking.technician.address && (
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <MapPin size={13} /> {booking.technician.address}
                  </p>
                )}
              </div>
              <button
                onClick={() => onMessageClick(booking)}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex-shrink-0"
              >
                <MessageCircle size={16} /> Message
                {Number(booking.unread_chat_count || 0) > 0 ? (
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold text-white">
                    {Number(booking.unread_chat_count) > 9 ? '9+' : Number(booking.unread_chat_count)}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        ) : normalizedStatus === 'pending' ? (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-4">
            <p className="text-yellow-700 text-sm flex items-center gap-2">
              <Clock size={15} /> Waiting for a technician to be assigned. We will notify you once confirmed.
            </p>
          </div>
        ) : null}
 
        {/* Progress tracker */}
        <BookingTimeline status={normalizedStatus} />
 
        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
          {canCancel && (
            <button onClick={() => onCancelClick(booking)} disabled={cancellingId === booking.id}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg transition font-semibold text-sm disabled:opacity-50">
              <XCircle size={16} />
              {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
          {canRebook && (
            <button onClick={() => onRebookClick(booking)}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg transition font-semibold text-sm">
              <RotateCcw size={16} /> Rebook
            </button>
          )}
          {canPayNow && (
            <button
              type="button"
              onClick={() => onPayClick(booking)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 px-4 py-2 rounded-lg transition font-semibold text-sm"
            >
              Pay Now (Khalti / eSewa)
            </button>
          )}
          {normalizedStatus === 'completed' && hasPaid && (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-semibold">
              Payment Completed ({booking.payment?.payment_method || 'online'})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
 
// ─── Page ─────────────────────────────────────────────────────────────────────
const MyBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatRouteHandledRef = useRef(false);
  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [cancellingId, setCancellingId]   = useState(null);
  const [activeTab, setActiveTab]         = useState('active');
  const [searchTerm, setSearchTerm]       = useState('');
  const [dateFilter, setDateFilter]       = useState('');
  const [cancelTarget, setCancelTarget]   = useState(null);
  const [cancelModalClosing, setCancelModalClosing] = useState(false);
  const [rebookService, setRebookService] = useState(null);
  const [isRebookOpen, setIsRebookOpen]   = useState(false);
  const [chatOpen, setChatOpen]           = useState(false);
  const [chatLoading, setChatLoading]     = useState(false);
  const [chatSending, setChatSending]     = useState(false);
  const [chatText, setChatText]           = useState('');
  const [chatConversation, setChatConversation] = useState(null);
  const [chatMessages, setChatMessages]   = useState([]);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [conversationMeta, setConversationMeta] = useState([]);
 
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || !user || user.role !== 'customer') { navigate('/login'); return; }
    fetchBookings();
  }, [navigate]);
 
  const fetchBookings = async () => {
    setLoading(true); setError('');
    try {
      const r = await customerAPI.getMyBookings();
      if (r.data.success) {
        setBookings(r.data.data || []);
      }
      await loadConversationMeta();
    } catch { setError('Failed to load your bookings. Please try again.'); }
    finally   { setLoading(false); }
  };

  const loadConversationMeta = async () => {
    try {
      const response = await messagesAPI.getConversations();
      const list = response.data?.data || [];
      setConversationMeta(list);
      list.forEach((item) => {
        if (item?.id) joinConversation(item.id);
      });
      return list;
    } catch (error) {
      console.error('Failed to load customer conversation metadata:', error);
      return [];
    }
  };
 
  const openCancelModal  = (b) => { setCancelModalClosing(false); setCancelTarget(b); };
  const closeCancelModal = () => {
    setCancelModalClosing(true);
    window.setTimeout(() => { setCancelTarget(null); setCancelModalClosing(false); }, 180);
  };
 
  const confirmCancel = async () => {
    if (!cancelTarget?.id) return;
    setCancellingId(cancelTarget.id);
    try {
      const r = await customerAPI.cancelBooking(cancelTarget.id);
      if (r.data.success) {
        setBookings((prev) => prev.map((b) => b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b));
        closeCancelModal();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel booking.'); }
    finally       { setCancellingId(null); }
  };
 
  const handleRebook = (booking) => {
    if (!booking?.service?.id) { toast.error('Service details are missing.'); return; }
    setRebookService(booking.service);
    setIsRebookOpen(true);
  };

  const openPaymentModal = (booking) => {
    setPaymentTarget(booking);
    setPaymentMethod('esewa');
  };

  const closePaymentModal = () => {
    if (paymentLoading) return;
    setPaymentTarget(null);
  };

  const submitEsewaForm = (paymentUrl, payload) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;
    Object.entries(payload).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const handlePaymentProceed = async () => {
    if (!paymentTarget?.id) return;

    try {
      setPaymentLoading(true);
      await paymentAPI.prepareBookingPayment(paymentTarget.id);

      if (paymentMethod === 'esewa') {
        const response = await paymentAPI.initiateEsewa(paymentTarget.id);
        const paymentUrl = response.data?.data?.paymentUrl;
        const payload = response.data?.data?.payload;
        if (!paymentUrl || !payload) {
          throw new Error('Invalid eSewa initiate response');
        }
        submitEsewaForm(paymentUrl, payload);
        return;
      }

      const response = await paymentAPI.initiateKhalti(paymentTarget.id);
      const paymentUrl = response.data?.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error('Invalid Khalti initiate response');
      }
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start payment');
      setPaymentLoading(false);
    }
  };

  const openChat = async (booking, options = {}) => {
    const bookingId = Number(options.bookingId || booking?.id || 0);
    const conversationId = Number(options.conversationId || 0);
    const params = new URLSearchParams();
    if (conversationId) params.set('conversationId', String(conversationId));
    if (bookingId) params.set('bookingId', String(bookingId));
    navigate(`/messages${params.toString() ? `?${params.toString()}` : ''}`);
  };

  useEffect(() => {
    if (chatRouteHandledRef.current) return;
    const params = new URLSearchParams(location.search);
    const chatConversationId = Number(params.get('chatConversationId') || 0);
    const bookingId = Number(params.get('bookingId') || 0);

    if (!chatConversationId && !bookingId) return;

    chatRouteHandledRef.current = true;
    openChat(null, { conversationId: chatConversationId, bookingId });
    navigate('/my-bookings', { replace: true });
  }, [location.search]);

  const sendChatMessage = async () => {
    if (!chatConversation?.id || !chatText.trim()) return;
    try {
      setChatSending(true);
      await messagesAPI.sendMessage(chatConversation.id, chatText.trim());
      setChatText('');
      const msgRes = await messagesAPI.getConversationMessages(chatConversation.id);
      setChatMessages(msgRes.data?.data?.messages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (!chatConversation?.id || !chatOpen) return;
    joinConversation(chatConversation.id);
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (payload) => {
      if (payload.conversation_id !== chatConversation.id) return;
      setChatMessages((prev) => [...prev, payload]);
    };

    socket.on('chat:message', onMessage);
    return () => socket.off('chat:message', onMessage);
  }, [chatConversation?.id, chatOpen]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = (payload) => {
      if (!payload?.conversation_id) return;
      setConversationMeta((prev) =>
        prev.map((item) =>
          item.id === payload.conversation_id
            ? {
                ...item,
                unread_count:
                  chatOpen && chatConversation?.id === payload.conversation_id
                    ? 0
                    : Number(item.unread_count || 0) + 1,
                last_message: payload,
              }
            : item
        )
      );
    };

    socket.on('chat:message', onIncoming);
    return () => socket.off('chat:message', onIncoming);
  }, [chatOpen, chatConversation?.id]);

  const unreadByBooking = useMemo(() => {
    const out = {};
    conversationMeta.forEach((item) => {
      const bookingId = Number(item.booking_id || item.booking?.id || 0);
      if (!bookingId) return;
      out[bookingId] = Number(item.unread_count || 0);
    });
    return out;
  }, [conversationMeta]);

  const bookingsWithUnread = useMemo(
    () =>
      bookings.map((b) => ({
        ...b,
        unread_chat_count: unreadByBooking[Number(b.id)] || 0,
      })),
    [bookings, unreadByBooking]
  );
 
  const filteredBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bookingsWithUnread
      .filter((b) => tabConfig[activeTab].matcher(normalizeStatus(b.status)))
      .filter((b) => {
        const matchText = !q || (b.service?.name?.toLowerCase()||'').includes(q) || (b.location?.toLowerCase()||'').includes(q);
        const matchDate = !dateFilter || b.booking_date === dateFilter;
        return matchText && matchDate;
      });
  }, [bookingsWithUnread, activeTab, searchTerm, dateFilter]);
 
  const counts = useMemo(() => ({
    active:    bookings.filter((b) => tabConfig.active.matcher(normalizeStatus(b.status))).length,
    completed: bookings.filter((b) => tabConfig.completed.matcher(normalizeStatus(b.status))).length,
    cancelled: bookings.filter((b) => tabConfig.cancelled.matcher(normalizeStatus(b.status))).length,
  }), [bookings]);
 
  return (
    <div className="pt-28 sm:pt-32 min-h-screen bg-gray-50 pb-8 sm:pb-12">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">My Bookings</h1>
            <p className="text-gray-500 mt-1">Track and manage your service requests</p>
          </div>
          <button onClick={fetchBookings} disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
 
        {/* Filters + Tabs */}
        <div className="bg-white rounded-2xl shadow-md p-3 sm:p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by service or location"
                className="w-full bg-white text-gray-800 placeholder:text-gray-400 pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-white text-gray-800 px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(tabConfig).map(([key, val]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === key ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {val.title} ({counts[key]})
              </button>
            ))}
          </div>
        </div>
 
        {loading && <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>}
        {error   && <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6"><AlertCircle size={20} className="text-red-500" /><p className="text-red-600">{error}</p></div>}
 
        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Bookings Yet</h2>
            <p className="text-gray-500 mb-6">You have not booked any services yet.</p>
            <button onClick={() => navigate('/services')} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">Browse Services</button>
          </div>
        )}
 
        {!loading && !error && bookings.length > 0 && filteredBookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-600">No bookings found for the selected filters.</div>
        )}
 
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-5">
            {filteredBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                cancellingId={cancellingId}
                onCancelClick={openCancelModal}
                onRebookClick={handleRebook}
                onMessageClick={openChat}
                onPayClick={openPaymentModal}
              />
            ))}
          </div>
        )}
      </div>
 
      <CancelBookingModal isOpen={Boolean(cancelTarget)} isClosing={cancelModalClosing} onClose={closeCancelModal} onConfirm={confirmCancel} loading={cancellingId === cancelTarget?.id} />
      <PaymentModal
        isOpen={Boolean(paymentTarget)}
        booking={paymentTarget}
        method={paymentMethod}
        onMethodChange={setPaymentMethod}
        onClose={closePaymentModal}
        onConfirm={handlePaymentProceed}
        loading={paymentLoading}
      />
      <BookingModal isOpen={isRebookOpen} service={rebookService} onClose={() => setIsRebookOpen(false)} onSuccess={() => { setIsRebookOpen(false); fetchBookings(); }} />

      <div className={`fixed inset-0 z-[80] ${chatOpen ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${chatOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setChatOpen(false)} />
        <div className={`absolute left-1/2 top-1/2 w-[94%] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all ${chatOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="flex items-start justify-between border-b border-gray-200 p-4">
            <div>
              <h3 className="text-lg font-bold text-blue-700">Direct Chat</h3>
              <p className="text-sm text-gray-500">{chatConversation ? `Booking #${chatConversation.booking_id}` : 'Loading conversation...'}</p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
          <div className="max-h-[56vh] overflow-y-auto p-4 space-y-3 bg-gray-50/60">
            {chatLoading ? <p className="text-gray-600">Loading chat...</p> : null}
            {!chatLoading && chatMessages.length === 0 ? <p className="text-gray-600">No messages yet.</p> : null}
            {chatMessages.map((msg) => {
              const currentUserId = Number(JSON.parse(localStorage.getItem('user') || '{}').id || 0);
              const mine = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-xl px-3 py-2 border shadow-sm ${mine ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`mt-1 text-[11px] ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChatMessage();
              }}
              placeholder="Type message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={sendChatMessage}
              disabled={chatSending || !chatText.trim()}
              className="bg-blue-600 text-white px-4 rounded-lg disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default MyBookings;
import { CalendarDays, ClipboardList, MapPinned, Phone, User, Wallet, X } from 'lucide-react';

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

const formatNpr = (amount) => `Rs ${Number(amount || 0).toFixed(2)}`;

export default function AcceptedModal({ job, onNavigate, onClose }) {
  const customer = job?.customer || {};
  const location = job?.location?.address || job?.location || customer?.address || 'Not available';
  const details = job?.description || job?.service?.name || job?.type || 'Service details not available';
  const when = formatDateLabel(job?.booking_date, job?.booking_time);
  const budget = job?.total_amount ? formatNpr(job.total_amount) : 'Not fixed';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 p-3 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/85">Success</p>
            <h2 className="text-base font-bold">You accepted! Customer details unlocked</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/15 p-1.5 hover:bg-white/25">
            <X size={15} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <DetailCard icon={<User size={14} />} label="Customer Name" value={customer?.name || 'Customer'} />
          <DetailCard icon={<Phone size={14} />} label="Phone Number" value={customer?.phone || 'Not available'} />
          <DetailCard icon={<MapPinned size={14} />} label="Full Address" value={location} span="sm:col-span-2" />
          <DetailCard icon={<ClipboardList size={14} />} label="Service Details" value={details} span="sm:col-span-2" />
          <DetailCard icon={<CalendarDays size={14} />} label="Date & Time" value={when} />
          <DetailCard icon={<Wallet size={14} />} label="Budget" value={budget} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigate(location)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            <MapPinned size={14} />
            Get Directions
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, span = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-2.5 ${span}`}>
      <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
